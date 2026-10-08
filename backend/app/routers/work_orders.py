from typing import Optional, List, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    WorkOrder, WorkOrderResponse, ResponseCoverage, Complaint, Issue,
    User, AuditEvent, ComplaintStatusHistory, Department
)
from ..security import get_current_user, require_role

router = APIRouter(prefix="/work-orders", tags=["Work Orders & Response Audits"])

class WorkOrderCreate(BaseModel):
    complaint_id: Optional[str] = None
    issue_id: Optional[str] = None
    department_id: str
    assigned_to: Optional[str] = None
    assigned_worker_id: Optional[str] = None
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

@router.post("")
def create_work_order(
    payload: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["MUNICIPAL_OFFICER", "SENIOR_AUTHORITY"]))
):
    complaint = None
    if payload.complaint_id:
        complaint = db.query(Complaint).filter(Complaint.id == payload.complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint record not found.")
        if complaint.status == "RESOLVED":
            raise HTTPException(status_code=400, detail="Cannot dispatch work order for an already resolved complaint.")

    # Validate department
    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail=f"Department '{payload.department_id}' not found.")

    # Validate assigned worker
    assigned_worker_id = payload.assigned_to or payload.assigned_worker_id
    if assigned_worker_id:
        worker = db.query(User).filter(User.id == assigned_worker_id).first()
        if not worker or worker.role != "FIELD_WORKER" or worker.is_active != 1:
            raise HTTPException(status_code=400, detail="Assigned user must be an active field worker.")

    # Validate issue
    if payload.issue_id:
        if not payload.complaint_id:
            raise HTTPException(status_code=400, detail="complaint_id is required when assigning an issue.")
        issue = db.query(Issue).filter(Issue.id == payload.issue_id, Issue.complaint_id == payload.complaint_id).first()
        if not issue:
            raise HTTPException(status_code=400, detail="Issue does not belong to the specified complaint.")

        existing_wo = db.query(WorkOrder).filter(
            WorkOrder.issue_id == payload.issue_id,
            WorkOrder.status.in_(["ASSIGNED", "IN_PROGRESS"])
        ).first()
        if existing_wo:
            raise HTTPException(status_code=409, detail=f"An active work order ({existing_wo.id}) is already assigned to this issue.")
    elif payload.complaint_id:
        existing_wo = db.query(WorkOrder).filter(
            WorkOrder.complaint_id == payload.complaint_id,
            WorkOrder.issue_id == None,
            WorkOrder.status.in_(["ASSIGNED", "IN_PROGRESS"])
        ).first()
        if existing_wo:
            raise HTTPException(status_code=409, detail=f"An active work order ({existing_wo.id}) is already assigned to this complaint.")

    priority_val = (payload.priority or "MEDIUM").upper()
    if priority_val not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        raise HTTPException(status_code=400, detail="Priority must be LOW, MEDIUM, HIGH, or CRITICAL.")

    wo_id = f"wo-{int(datetime.utcnow().timestamp()*1000)}"
    now_iso = datetime.utcnow().isoformat()

    work_order = WorkOrder(
        id=wo_id,
        complaint_id=payload.complaint_id,
        issue_id=payload.issue_id,
        department_id=payload.department_id,
        assigned_to=assigned_worker_id,
        priority=priority_val,
        status="ASSIGNED",
        instructions=payload.instructions,
        target_completion=payload.target_completion,
        created_at=now_iso,
        updated_at=now_iso
    )
    db.add(work_order)

    if payload.issue_id:
        issue = db.query(Issue).filter(Issue.id == payload.issue_id).first()
        if issue:
            issue.work_order_id = wo_id
            issue.status = "ASSIGNED"
            issue.updated_at = now_iso

    if complaint and complaint.status not in ["IN_PROGRESS", "RESOLVED"]:
        old_status = complaint.status
        complaint.status = "IN_PROGRESS"
        complaint.updated_at = now_iso
        history = ComplaintStatusHistory(
            id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
            complaint_id=complaint.id,
            old_status=old_status,
            new_status="IN_PROGRESS",
            changed_by=current_user.id,
            notes=f"Work order {wo_id} issued by officer {current_user.name}",
            created_at=now_iso
        )
        db.add(history)

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=current_user.id,
        actor_name=current_user.name,
        role=current_user.role,
        action="Work Order Issued",
        entity_type="WORK_ORDER",
        entity_id=wo_id,
        details=f"Complaint: {payload.complaint_id}, Department: {payload.department_id}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {"message": "Work order created.", "id": wo_id, "status": "ASSIGNED"}

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
    if status and status != "ALL":
        query = query.filter(WorkOrder.status == status)
    if complaint_id:
        query = query.filter(WorkOrder.complaint_id == complaint_id)

    orders = query.order_by(WorkOrder.created_at.desc()).all()
    results = []
    for o in orders:
        complaint = db.query(Complaint).filter(Complaint.id == o.complaint_id).first()
        worker = db.query(User).filter(User.id == o.assigned_to).first() if o.assigned_to else None
        dept = db.query(Department).filter(Department.id == o.department_id).first() if o.department_id else None
        latest_resp = db.query(WorkOrderResponse).filter(WorkOrderResponse.work_order_id == o.id).order_by(WorkOrderResponse.created_at.desc()).first()

        results.append({
            "id": o.id,
            "complaint_id": o.complaint_id,
            "complaint_tracking_id": complaint.tracking_id if complaint else None,
            "complaint_title": complaint.title if complaint else None,
            "complaint_location": complaint.location if complaint else None,
            "complaint_status": complaint.status if complaint else None,
            "complaint_category": complaint.category if complaint else None,
            "issue_id": o.issue_id,
            "department_id": o.department_id,
            "department_name": dept.name if dept else None,
            "assigned_to": o.assigned_to,
            "assigned_worker_name": worker.name if worker else "Unassigned Crew",
            "priority": o.priority,
            "status": o.status,
            "instructions": o.instructions,
            "target_completion": o.target_completion,
            "completed_at": o.completed_at,
            "response_text": latest_resp.response_text if latest_resp else None,
            "photo_url": latest_resp.photo_url if latest_resp else None,
            "photo_sha256": latest_resp.photo_sha256 if latest_resp else None,
            "created_at": o.created_at,
            "updated_at": o.updated_at
        })
    return results

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

    complaint = db.query(Complaint).filter(Complaint.id == order.complaint_id).first()
    worker = db.query(User).filter(User.id == order.assigned_to).first() if order.assigned_to else None
    dept = db.query(Department).filter(Department.id == order.department_id).first() if order.department_id else None
    issue = db.query(Issue).filter(Issue.id == order.issue_id).first() if order.issue_id else None

    responses = db.query(WorkOrderResponse).filter(WorkOrderResponse.work_order_id == work_order_id).order_by(WorkOrderResponse.created_at.desc()).all()
    return {
        "workOrder": {
            "id": order.id,
            "complaint_id": order.complaint_id,
            "complaint_tracking_id": complaint.tracking_id if complaint else None,
            "complaint_title": complaint.title if complaint else None,
            "complaint_location": complaint.location if complaint else None,
            "complaint_status": complaint.status if complaint else None,
            "complaint_category": complaint.category if complaint else None,
            "issue_id": order.issue_id,
            "issue_description": issue.description if issue else None,
            "department_id": order.department_id,
            "department_name": dept.name if dept else None,
            "assigned_to": order.assigned_to,
            "assigned_worker_name": worker.name if worker else "Unassigned Crew",
            "priority": order.priority,
            "status": order.status,
            "instructions": order.instructions,
            "target_completion": order.target_completion,
            "completed_at": order.completed_at,
            "created_at": order.created_at,
            "updated_at": order.updated_at
        },
        "complaint": {
            "id": complaint.id,
            "tracking_id": complaint.tracking_id,
            "title": complaint.title,
            "description": complaint.description,
            "location": complaint.location,
            "status": complaint.status
        } if complaint else None,
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

    if order.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Invalid state: Work order is already completed.")

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

    if order.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Invalid state: Work order is already completed.")

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
    cov_status = payload.coverage_status.upper()
    if cov_status == "OVERDUE":
        raise HTTPException(
            status_code=400,
            detail="Invalid coverage status: 'OVERDUE' is a workflow condition, not a response coverage category."
        )

    valid_labels = ["ADDRESSED", "PARTIAL", "NOT_ADDRESSED", "UNCLEAR"]
    if cov_status not in valid_labels:
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
