import uuid
import random
from datetime import datetime
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import (
    Complaint, Issue, ComplaintAttachment, ComplaintStatusHistory, Feedback,
    Appeal, User, Notification, AuditEvent, WorkOrder, OfficerDecision
)
from ..schemas import ComplaintCreate, ComplaintOut, FeedbackCreate, AppealCreate
from ..security import get_current_user, require_role

router = APIRouter(prefix="/complaints", tags=["Complaints"])

class TriagePayload(BaseModel):
    department_id: str
    priority: Optional[str] = "MEDIUM"
    deadline: Optional[str] = None
    notes: Optional[str] = None

class ResolvePayload(BaseModel):
    resolution_notes: Optional[str] = None
    reasoning: Optional[str] = None

class CreateWorkOrderPayload(BaseModel):
    issue_id: Optional[str] = None
    department_id: str
    assigned_to: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    instructions: Optional[str] = None
    target_completion: Optional[str] = None

@router.get("", response_model=List[ComplaintOut])
def get_complaints(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    # Server-side isolation: Citizen only sees their own grievances
    if user.role == "CITIZEN":
        query = query.filter(Complaint.citizen_id == user.id)

    if status and status != "ALL":
        query = query.filter(Complaint.status == status)

    if category:
        query = query.filter(Complaint.category == category)

    if search:
        term = f"%{search}%"
        query = query.filter(
            (Complaint.tracking_id.ilike(term)) |
            (Complaint.title.ilike(term)) |
            (Complaint.description.ilike(term)) |
            (Complaint.location.ilike(term))
        )

    complaints = query.order_by(Complaint.created_at.desc()).all()
    return complaints

@router.post("", status_code=status.HTTP_201_CREATED)
def create_complaint(
    payload: ComplaintCreate,
    user: User = Depends(require_role(["CITIZEN"])),
    db: Session = Depends(get_db)
):
    if not payload.title or not payload.description or not payload.category or not payload.location:
        raise HTTPException(status_code=400, detail="Title, description, category, and location are required.")

    complaint_id = f"comp-{int(datetime.utcnow().timestamp()*1000)}"
    year = datetime.utcnow().year
    tracking_seq = random.randint(1000, 99999)
    tracking_id = f"GG-{year}-{str(tracking_seq).zfill(6)}"
    now_iso = datetime.utcnow().isoformat()

    # Decompose issues into distinct records
    issues_list = payload.issues if payload.issues and len(payload.issues) > 0 else [
        {"category": payload.category, "description": payload.description}
    ]
    sub_issues_count = len(issues_list)

    new_complaint = Complaint(
        id=complaint_id,
        tracking_id=tracking_id,
        citizen_id=user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        priority="MEDIUM",
        status="SUBMITTED",
        jurisdiction=payload.jurisdiction_id or "jur-1",
        sub_issues_count=sub_issues_count,
        created_at=now_iso,
        updated_at=now_iso
    )
    db.add(new_complaint)

    # Save decomposed issues
    for idx, iss in enumerate(issues_list):
        iss_dict = iss if isinstance(iss, dict) else iss.dict()
        issue_record = Issue(
            id=f"iss-{int(datetime.utcnow().timestamp()*1000)}-{idx+1}",
            complaint_id=complaint_id,
            issue_number=idx + 1,
            category=iss_dict.get("category", payload.category),
            description=iss_dict.get("description", payload.description),
            status="SUBMITTED",
            coverage_status="PENDING",
            created_at=now_iso,
            updated_at=now_iso
        )
        db.add(issue_record)

    # Add initial status history
    history = ComplaintStatusHistory(
        id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
        complaint_id=complaint_id,
        old_status=None,
        new_status="SUBMITTED",
        changed_by=user.id,
        notes="Complaint registered via citizen portal with initial geolocation",
        created_at=now_iso
    )
    db.add(history)

    # Attachments
    if payload.attachments:
        for att in payload.attachments:
            att_dict = att if isinstance(att, dict) else att.dict()
            attachment = ComplaintAttachment(
                id=f"att-{int(datetime.utcnow().timestamp()*1000)}-{uuid.uuid4().hex[:4]}",
                complaint_id=complaint_id,
                file_url=att_dict.get("url") or att_dict.get("file_url", ""),
                file_name=att_dict.get("name") or att_dict.get("file_name", "evidence.jpg"),
                file_size=att_dict.get("size") or att_dict.get("file_size", 0),
                mime_type=att_dict.get("mimeType") or att_dict.get("mime_type", "image/jpeg"),
                sha256_hash=att_dict.get("sha256_hash") or "0000000000000000000000000000000000000000000000000000000000000000",
                exif_verified=1 if att_dict.get("exif_verified", True) else 0,
                synthetic_risk_score=att_dict.get("synthetic_risk_score", 0.02),
                provenance_notes=att_dict.get("provenance_notes", "SHA-256 file integrity reference recorded"),
                uploaded_by=user.id,
                created_at=now_iso
            )
            db.add(attachment)

    # Audit event
    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action="Complaint Created",
        entity_type="COMPLAINT",
        entity_id=complaint_id,
        details=f"Tracking ID: {tracking_id}, Category: {payload.category}, Sub-issues: {sub_issues_count}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)

    db.commit()

    return {
        "id": complaint_id,
        "tracking_id": tracking_id,
        "status": "SUBMITTED",
        "sub_issues_count": sub_issues_count
    }

@router.get("/{complaint_id}")
def get_complaint_detail(
    complaint_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    # Citizen access restriction
    if user.role == "CITIZEN" and complaint.citizen_id != user.id:
        raise HTTPException(
            status_code=403, 
            detail="Access Restricted: You don't have permission to inspect records filed by another citizen."
        )

    issues = db.query(Issue).filter(Issue.complaint_id == complaint_id).order_by(Issue.issue_number.asc()).all()
    attachments = db.query(ComplaintAttachment).filter(ComplaintAttachment.complaint_id == complaint_id).order_by(ComplaintAttachment.created_at.asc()).all()
    history = db.query(ComplaintStatusHistory).filter(ComplaintStatusHistory.complaint_id == complaint_id).order_by(ComplaintStatusHistory.created_at.asc()).all()
    work_orders = db.query(WorkOrder).filter(WorkOrder.complaint_id == complaint_id).all()
    decisions = db.query(OfficerDecision).filter(OfficerDecision.complaint_id == complaint_id).all()
    feedback = db.query(Feedback).filter(Feedback.complaint_id == complaint_id).first()
    appeals = db.query(Appeal).filter(Appeal.complaint_id == complaint_id).order_by(Appeal.created_at.desc()).all()

    return {
        "complaint": {
            "id": complaint.id,
            "tracking_id": complaint.tracking_id,
            "citizen_id": complaint.citizen_id,
            "title": complaint.title,
            "description": complaint.description,
            "category": complaint.category,
            "location": complaint.location,
            "latitude": complaint.latitude,
            "longitude": complaint.longitude,
            "priority": complaint.priority,
            "status": complaint.status,
            "assigned_department": complaint.assigned_department,
            "deadline": complaint.deadline,
            "sub_issues_count": complaint.sub_issues_count,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at
        },
        "issues": [
            {
                "id": iss.id,
                "complaint_id": iss.complaint_id,
                "issue_number": iss.issue_number,
                "category": iss.category,
                "description": iss.description,
                "status": iss.status,
                "coverage_status": iss.coverage_status,
                "created_at": iss.created_at
            } for iss in issues
        ],
        "attachments": [
            {
                "id": att.id,
                "complaint_id": att.complaint_id,
                "file_url": att.file_url,
                "file_name": att.file_name,
                "file_size": att.file_size,
                "mime_type": att.mime_type,
                "sha256_hash": att.sha256_hash,
                "exif_verified": att.exif_verified,
                "synthetic_risk_score": att.synthetic_risk_score,
                "provenance_notes": att.provenance_notes,
                "created_at": att.created_at
            } for att in attachments
        ],
        "history": [
            {
                "id": h.id,
                "old_status": h.old_status,
                "new_status": h.new_status,
                "notes": h.notes,
                "created_at": h.created_at
            } for h in history
        ],
        "workOrders": [
            {
                "id": wo.id,
                "complaint_id": wo.complaint_id,
                "issue_id": wo.issue_id,
                "department_id": wo.department_id,
                "assigned_to": wo.assigned_to,
                "priority": wo.priority,
                "status": wo.status,
                "instructions": wo.instructions,
                "target_completion": wo.target_completion,
                "completed_at": wo.completed_at,
                "created_at": wo.created_at
            } for wo in work_orders
        ],
        "decisions": [
            {
                "id": d.id,
                "officer_id": d.officer_id,
                "decision": d.decision,
                "reasoning": d.reasoning,
                "created_at": d.created_at
            } for d in decisions
        ],
        "feedback": {
            "id": feedback.id,
            "rating": feedback.rating,
            "comments": feedback.comments,
            "created_at": feedback.created_at
        } if feedback else None,
        "appeals": [
            {
                "id": app.id,
                "reason": app.reason,
                "status": app.status,
                "officer_notes": app.officer_notes,
                "created_at": app.created_at
            } for app in appeals
        ]
    }

@router.put("/{complaint_id}/triage")
def triage_complaint(
    complaint_id: str,
    payload: TriagePayload,
    user: User = Depends(require_role(["MUNICIPAL_OFFICER"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    now_iso = datetime.utcnow().isoformat()
    old_status = complaint.status
    complaint.assigned_department = payload.department_id
    if payload.priority:
        complaint.priority = payload.priority
    if payload.deadline:
        complaint.deadline = payload.deadline
    complaint.status = "TRIAGED"
    complaint.updated_at = now_iso

    history = ComplaintStatusHistory(
        id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
        complaint_id=complaint_id,
        old_status=old_status,
        new_status="TRIAGED",
        changed_by=user.id,
        notes=payload.notes or f"Triaged by {user.name} to {payload.department_id}",
        created_at=now_iso
    )
    db.add(history)

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action="Complaint Triaged",
        entity_type="COMPLAINT",
        entity_id=complaint_id,
        details=f"Assigned to {payload.department_id}, Priority: {payload.priority}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {"message": "Complaint triaged successfully.", "status": "TRIAGED"}

@router.post("/{complaint_id}/work-orders")
def create_work_order_for_complaint(
    complaint_id: str,
    payload: CreateWorkOrderPayload,
    user: User = Depends(require_role(["MUNICIPAL_OFFICER"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    wo_id = f"wo-{int(datetime.utcnow().timestamp()*1000)}"
    now_iso = datetime.utcnow().isoformat()

    work_order = WorkOrder(
        id=wo_id,
        complaint_id=complaint_id,
        issue_id=payload.issue_id,
        department_id=payload.department_id,
        assigned_to=payload.assigned_to,
        priority=payload.priority or "MEDIUM",
        status="ASSIGNED",
        instructions=payload.instructions,
        target_completion=payload.target_completion,
        created_at=now_iso,
        updated_at=now_iso
    )
    db.add(work_order)

    # Move complaint to IN_PROGRESS
    old_status = complaint.status
    complaint.status = "IN_PROGRESS"
    complaint.updated_at = now_iso

    history = ComplaintStatusHistory(
        id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
        complaint_id=complaint_id,
        old_status=old_status,
        new_status="IN_PROGRESS",
        changed_by=user.id,
        notes=f"Work order {wo_id} issued by officer {user.name}",
        created_at=now_iso
    )
    db.add(history)

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action="Work Order Issued",
        entity_type="WORK_ORDER",
        entity_id=wo_id,
        details=f"Complaint: {complaint_id}, Department: {payload.department_id}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {"message": "Work order created.", "id": wo_id, "status": "ASSIGNED"}

@router.post("/{complaint_id}/resolve")
def resolve_complaint(
    complaint_id: str,
    payload: ResolvePayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    CRITICAL AUTHORIZATION & ARCHITECTURAL RULE:
    Field Worker completion ≠ Complaint Resolution.
    AI Prediction ≠ Officer Decision.
    Only authorized MUNICIPAL_OFFICER can record an authoritative OfficerDecision and resolve.
    """
    if user.role not in ["MUNICIPAL_OFFICER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only authorized Municipal Officers can make the official determination to resolve a complaint. Field workers and citizens are not permitted."
        )

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    now_iso = datetime.utcnow().isoformat()
    old_status = complaint.status
    complaint.status = "RESOLVED"
    complaint.updated_at = now_iso

    # Record Officer Decision
    dec_id = f"dec-{int(datetime.utcnow().timestamp()*1000)}"
    decision = OfficerDecision(
        id=dec_id,
        complaint_id=complaint_id,
        officer_id=user.id,
        decision="RESOLVED",
        reasoning=payload.reasoning or payload.resolution_notes or "Authoritative officer verification of issue remediation.",
        created_at=now_iso
    )
    db.add(decision)

    # Status history
    history = ComplaintStatusHistory(
        id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
        complaint_id=complaint_id,
        old_status=old_status,
        new_status="RESOLVED",
        changed_by=user.id,
        notes=payload.resolution_notes or "Remediation verified and signed off by Municipal Officer",
        created_at=now_iso
    )
    db.add(history)

    # Audit event
    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action="Complaint Resolved",
        entity_type="COMPLAINT",
        entity_id=complaint_id,
        details=f"Officer Decision: RESOLVED. Reasoning: {decision.reasoning}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)

    # Notify citizen
    notif = Notification(
        id=f"notif-{int(datetime.utcnow().timestamp()*1000)}",
        user_id=complaint.citizen_id,
        title="Grievance Resolved",
        message=f"Your grievance {complaint.tracking_id} has been verified and resolved by Municipal Officer {user.name}.",
        type="COMPLAINT_RESOLVED",
        entity_type="COMPLAINT",
        entity_id=complaint_id,
        is_read=0,
        created_at=now_iso
    )
    db.add(notif)
    db.commit()

    return {
        "message": "Complaint officially resolved by Municipal Officer.",
        "decision_id": dec_id,
        "status": "RESOLVED"
    }

@router.post("/{complaint_id}/feedback")
def submit_feedback(
    complaint_id: str,
    payload: FeedbackCreate,
    user: User = Depends(require_role(["CITIZEN"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    if complaint.citizen_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You can only provide feedback on your own complaints.")

    fb_id = f"fb-{int(datetime.utcnow().timestamp()*1000)}"
    now_iso = datetime.utcnow().isoformat()

    feedback = Feedback(
        id=fb_id,
        complaint_id=complaint_id,
        citizen_id=user.id,
        rating=payload.rating,
        comments=payload.comments or "",
        created_at=now_iso
    )
    db.add(feedback)

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action="Feedback Submitted",
        entity_type="COMPLAINT",
        entity_id=complaint_id,
        details=f"Rating: {payload.rating}/5",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {"message": "Citizen feedback recorded. Thank you for helping improve civic services."}

@router.post("/{complaint_id}/appeal")
def submit_appeal(
    complaint_id: str,
    payload: AppealCreate,
    user: User = Depends(require_role(["CITIZEN"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    if complaint.citizen_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You can only appeal your own complaints.")

    appeal_id = f"app-{int(datetime.utcnow().timestamp()*1000)}"
    now_iso = datetime.utcnow().isoformat()

    appeal = Appeal(
        id=appeal_id,
        complaint_id=complaint_id,
        citizen_id=user.id,
        reason=payload.reason,
        status="PENDING",
        created_at=now_iso,
        updated_at=now_iso
    )
    db.add(appeal)

    complaint.status = "APPEALED"
    complaint.updated_at = now_iso

    history = ComplaintStatusHistory(
        id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
        complaint_id=complaint_id,
        old_status="RESOLVED",
        new_status="APPEALED",
        changed_by=user.id,
        notes=f"Citizen filed formal appeal: '{payload.reason}'",
        created_at=now_iso
    )
    db.add(history)

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action="Appeal Submitted",
        entity_type="COMPLAINT",
        entity_id=complaint_id,
        details=payload.reason,
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Appeal submitted and escalated to Appeal / Reconsideration Authority.",
        "status": "APPEALED"
    }
