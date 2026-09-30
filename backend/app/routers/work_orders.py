from typing import Optional, List, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    WorkOrder, WorkOrderResponse, ResponseCoverage, Complaint, Issue,
    User, AuditEvent, ComplaintStatusHistory
)
from ..security import get_current_user, require_role

router = APIRouter(prefix="/work-orders", tags=["Work Orders & Response Audits"])

class WorkOrderCreate(BaseModel):
    issue_id: Optional[str] = None
    department_id: str
    assigned_to: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    instructions: Optional[str] = None
    target_completion: Optional[str] = None

class WorkOrderUpdate(BaseModel):
    remarks: str

class WorkOrderComplete(BaseModel):
    remarks: str
    photo_url: Optional[str] = None
    photo_sha256: Optional[str] = None

class ResponseCoverageAudit(BaseModel):
    issue_id: str
    coverage_status: str  # ADDRESSED, PARTIAL, NOT_ADDRESSED, UNCLEAR
    notes: Optional[str] = None

@router.get("")
def get_work_orders(
    status: Optional[str] = Query(None),
    complaint_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(WorkOrder)
    if current_user.role == "FIELD_WORKER":
        query = query.filter(WorkOrder.assigned_to == current_user.id)
    if status:
        query = query.filter(WorkOrder.status == status)
    if complaint_id:
        query = query.filter(WorkOrder.complaint_id == complaint_id)

    orders = query.order_by(WorkOrder.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "complaint_id": o.complaint_id,
            "issue_id": o.issue_id,
            "department_id": o.department_id,
            "assigned_to": o.assigned_to,
            "priority": o.priority,
            "status": o.status,
            "instructions": o.instructions,
            "target_completion": o.target_completion,
            "completed_at": o.completed_at,
            "created_at": o.created_at,
            "updated_at": o.updated_at
        }
        for o in orders
    ]

@router.get("/{work_order_id}")
def get_work_order_detail(
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found.")

    if current_user.role == "FIELD_WORKER" and order.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You are not assigned to this work order.")

    responses = db.query(WorkOrderResponse).filter(WorkOrderResponse.work_order_id == work_order_id).all()
    return {
        "workOrder": {
            "id": order.id,
            "complaint_id": order.complaint_id,
            "issue_id": order.issue_id,
            "department_id": order.department_id,
            "assigned_to": order.assigned_to,
            "priority": order.priority,
            "status": order.status,
            "instructions": order.instructions,
            "target_completion": order.target_completion,
            "completed_at": order.completed_at,
            "created_at": order.created_at,
            "updated_at": order.updated_at
        },
        "responses": [
            {
                "id": r.id,
                "worker_id": r.worker_id,
                "response_text": r.response_text,
                "photo_url": r.photo_url,
                "photo_sha256": r.photo_sha256,
                "created_at": r.created_at
            }
            for r in responses
        ]
    }

@router.put("/{work_order_id}/start")
def start_work_order(
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["FIELD_WORKER", "MUNICIPAL_OFFICER"]))
):
    order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found.")

    if current_user.role == "FIELD_WORKER" and order.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only start work orders assigned to you.")

    now_iso = datetime.utcnow().isoformat()
    order.status = "IN_PROGRESS"
    order.updated_at = now_iso

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=current_user.id,
        actor_name=current_user.name,
        role=current_user.role,
        action="Work Order Started",
        entity_type="WORK_ORDER",
        entity_id=order.id,
        details=f"Field work started by {current_user.name}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()
    return {"message": "Work order marked IN_PROGRESS.", "status": "IN_PROGRESS"}

@router.post("/{work_order_id}/complete")
def complete_work_order(
    work_order_id: str,
    payload: WorkOrderComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["FIELD_WORKER", "MUNICIPAL_OFFICER"]))
):
    order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found.")

    if current_user.role == "FIELD_WORKER" and order.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only complete work orders assigned to you.")

    now_iso = datetime.utcnow().isoformat()
    order.status = "COMPLETED"
    order.completed_at = now_iso
    order.updated_at = now_iso

    # Record WorkOrderResponse
    resp_id = f"wresp-{int(datetime.utcnow().timestamp()*1000)}"
    response = WorkOrderResponse(
        id=resp_id,
        work_order_id=order.id,
        worker_id=current_user.id,
        response_text=payload.remarks,
        photo_url=payload.photo_url,
        photo_sha256=payload.photo_sha256,
        created_at=now_iso
    )
    db.add(response)

    # CRITICAL ARCHITECTURAL RULE:
    # FIELD WORKER COMPLETION ≠ COMPLAINT RESOLUTION
    # Field completion moves the complaint to AWAITING_VERIFICATION, NOT RESOLVED!
    complaint = db.query(Complaint).filter(Complaint.id == order.complaint_id).first()
    if complaint and complaint.status != "RESOLVED":
        complaint.status = "AWAITING_VERIFICATION"
        complaint.updated_at = now_iso
        history = ComplaintStatusHistory(
            id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
            complaint_id=complaint.id,
            old_status="IN_PROGRESS",
            new_status="AWAITING_VERIFICATION",
            changed_by=current_user.id,
            notes="Field worker submitted work completion report. Awaiting officer verification.",
            created_at=now_iso
        )
        db.add(history)

    # Update issue status if linked
    if order.issue_id:
        issue = db.query(Issue).filter(Issue.id == order.issue_id).first()
        if issue:
            issue.status = "AWAITING_VERIFICATION"
            issue.updated_at = now_iso

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=current_user.id,
        actor_name=current_user.name,
        role=current_user.role,
        action="Field Work Completed",
        entity_type="WORK_ORDER",
        entity_id=order.id,
        details=f"Remarks: {payload.remarks}. Note: Complaint resolution requires officer audit.",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Work order completion registered. Complaint moved to AWAITING_VERIFICATION for officer audit.",
        "status": "COMPLETED"
    }

@router.post("/{work_order_id}/verify")
def verify_work_order(
    work_order_id: str,
    payload: ResponseCoverageAudit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MUNICIPAL_OFFICER"]))
):
    """
    Officer Resolution Audit:
    Authoritative officer audits response coverage against the specific issue.
    Labels: ADDRESSED, PARTIAL, NOT_ADDRESSED, UNCLEAR
    """
    valid_labels = ["ADDRESSED", "PARTIAL", "NOT_ADDRESSED", "UNCLEAR"]
    if payload.coverage_status not in valid_labels:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid coverage status '{payload.coverage_status}'. Must be one of: {valid_labels}"
        )

    order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found.")

    now_iso = datetime.utcnow().isoformat()
    issue = db.query(Issue).filter(Issue.id == payload.issue_id).first()
    if issue:
        issue.coverage_status = payload.coverage_status
        issue.updated_at = now_iso

    cov_id = f"cov-{int(datetime.utcnow().timestamp()*1000)}"
    coverage = ResponseCoverage(
        id=cov_id,
        issue_id=payload.issue_id,
        response_id=None,
        coverage_status=payload.coverage_status,
        is_officer_audited=1,
        audited_by=current_user.id,
        audit_notes=payload.notes or f"Coverage audited as {payload.coverage_status} by {current_user.name}",
        created_at=now_iso,
        updated_at=now_iso
    )
    db.add(coverage)

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=current_user.id,
        actor_name=current_user.name,
        role=current_user.role,
        action="Response Coverage Audited",
        entity_type="ISSUE",
        entity_id=payload.issue_id,
        details=f"Coverage: {payload.coverage_status}. Officer: {current_user.name}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Issue coverage audited as {payload.coverage_status}.",
        "coverage_status": payload.coverage_status
    }
