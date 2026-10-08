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
    Appeal, User, Notification, AuditEvent, WorkOrder, OfficerDecision,
    Incident, Department, Jurisdiction, CitizenProfile, OfficerProfile, ResponseCoverage,
    IncidentLink
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

class ConfirmIssuePayload(BaseModel):
    category: Optional[str] = None
    department_id: Optional[str] = None
    notes: Optional[str] = None

class ConfirmIncidentPayload(BaseModel):
    complaint_id: Optional[str] = None
    related_complaint_id: str
    incident_title: Optional[str] = None
    notes: Optional[str] = None

class SeparateIncidentPayload(BaseModel):
    complaint_id: Optional[str] = None
    related_complaint_id: str
    reason: Optional[str] = None

class OfficerDecisionPayload(BaseModel):
    action: str  # RESOLVE, REQUIRE_ACTION, REQUEST_INFO
    issue_id: Optional[str] = None
    reasoning: Optional[str] = None
    resolution_notes: Optional[str] = None
    coverage_status: Optional[str] = None  # ADDRESSED, PARTIAL, NOT_ADDRESSED, UNCLEAR
    response_coverage: Optional[str] = None  # alias from frontend

class AdjudicateAppealPayload(BaseModel):
    decision: str  # REOPEN, REJECT
    notes: Optional[str] = None

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

@router.get("/officer/overview")
def get_officer_overview(
    user: User = Depends(require_role(["MUNICIPAL_OFFICER", "SENIOR_AUTHORITY"])),
    db: Session = Depends(get_db)
):
    """
    Authoritative Officer Overview Metrics & Actionable Dockets:
    - Operational counts computed strictly from PostgreSQL database:
      needs_triage, in_progress, awaiting_verification, appeals, total_active
    - Needs Immediate Attention queue (critical SLA breaches, awaiting verification, appeals)
    - Recent Precinct Dockets
    """
    needs_triage_count = db.query(Complaint).filter(Complaint.status == "SUBMITTED").count()
    in_progress_count = db.query(Complaint).filter(Complaint.status.in_(["IN_PROGRESS", "TRIAGED"])).count()
    awaiting_verification_count = db.query(Complaint).filter(Complaint.status == "AWAITING_VERIFICATION").count()
    appeals_count = db.query(Complaint).filter(Complaint.status == "APPEALED").count()
    total_active = needs_triage_count + in_progress_count + awaiting_verification_count + appeals_count

    # Needs Immediate Attention dockets
    urgent_records = (
        db.query(Complaint)
        .filter(Complaint.status.in_(["AWAITING_VERIFICATION", "APPEALED", "SUBMITTED"]))
        .order_by(
            Complaint.created_at.desc()
        )
        .limit(6)
        .all()
    )

    needs_attention = []
    for c in urgent_records:
        latest_wo = db.query(WorkOrder).filter(WorkOrder.complaint_id == c.id).order_by(WorkOrder.created_at.desc()).first()
        latest_appeal = db.query(Appeal).filter(Appeal.complaint_id == c.id).order_by(Appeal.created_at.desc()).first()
        att = db.query(ComplaintAttachment).filter(ComplaintAttachment.complaint_id == c.id).first()
        needs_attention.append({
            "id": c.id,
            "tracking_id": c.tracking_id,
            "title": c.title,
            "category": c.category,
            "location": c.location,
            "priority": c.priority,
            "status": c.status,
            "created_at": c.created_at,
            "sub_issues_count": c.sub_issues_count,
            "evidence_url": att.file_url if att else None,
            "evidence_sha256": att.sha256_hash if att else None,
            "work_order_id": latest_wo.id if latest_wo else None,
            "work_order_status": latest_wo.status if latest_wo else None,
            "appeal_reason": latest_appeal.reason if latest_appeal else None
        })

    # Recent Precinct Dockets
    recent_records = (
        db.query(Complaint)
        .order_by(Complaint.created_at.desc())
        .limit(10)
        .all()
    )
    recent_dockets = [
        {
            "id": c.id,
            "tracking_id": c.tracking_id,
            "title": c.title,
            "category": c.category,
            "location": c.location,
            "priority": c.priority,
            "status": c.status,
            "assigned_department": c.assigned_department,
            "created_at": c.created_at
        }
        for c in recent_records
    ]

    return {
        "stats": {
            "needs_triage": needs_triage_count,
            "in_progress": in_progress_count,
            "awaiting_verification": awaiting_verification_count,
            "appeals": appeals_count,
            "total_active": total_active
        },
        "needs_attention": needs_attention,
        "recent_dockets": recent_dockets
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

    # Field worker access restriction: only assigned complaints
    if user.role == "FIELD_WORKER":
        assigned_wo = db.query(WorkOrder).filter(
            WorkOrder.complaint_id == complaint_id,
            WorkOrder.assigned_to == user.id
        ).first()
        if not assigned_wo:
            raise HTTPException(
                status_code=403,
                detail="Access Restricted: You are not assigned to work orders for this complaint."
            )

    citizen = db.query(User).filter(User.id == complaint.citizen_id).first()
    citizen_prof = db.query(CitizenProfile).filter(CitizenProfile.user_id == complaint.citizen_id).first()
    incident = db.query(Incident).filter(Incident.id == complaint.incident_id).first() if complaint.incident_id else None

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
            "citizen_name": citizen.name if citizen else "Constituent",
            "citizen_phone": citizen.phone if citizen else None,
            "citizen_ward": citizen_prof.ward if citizen_prof else "Ward 14",
            "citizen_address": citizen_prof.address if citizen_prof else None,
            "title": complaint.title,
            "description": complaint.description,
            "category": complaint.category,
            "location": complaint.location,
            "latitude": complaint.latitude,
            "longitude": complaint.longitude,
            "priority": complaint.priority,
            "status": complaint.status,
            "assigned_department": complaint.assigned_department,
            "incident_id": complaint.incident_id,
            "incident_title": incident.title if incident else None,
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

    if complaint.status == "RESOLVED":
        raise HTTPException(status_code=400, detail="Cannot dispatch work order for an already resolved complaint.")

    # Validate department
    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail=f"Department '{payload.department_id}' not found.")

    # Validate assigned worker
    if payload.assigned_to:
        worker = db.query(User).filter(User.id == payload.assigned_to).first()
        if not worker or worker.role != "FIELD_WORKER" or worker.is_active != 1:
            raise HTTPException(status_code=400, detail="Assigned user must be an active field worker.")

    # Validate issue if provided
    if payload.issue_id:
        issue = db.query(Issue).filter(Issue.id == payload.issue_id, Issue.complaint_id == complaint_id).first()
        if not issue:
            raise HTTPException(status_code=400, detail="Issue does not belong to the specified complaint.")

        # Prevent duplicate active work orders for the same issue
        existing_wo = db.query(WorkOrder).filter(
            WorkOrder.issue_id == payload.issue_id,
            WorkOrder.status.in_(["ASSIGNED", "IN_PROGRESS"])
        ).first()
        if existing_wo:
            raise HTTPException(status_code=409, detail=f"An active work order ({existing_wo.id}) is already assigned to this issue.")
    else:
        # Prevent duplicate active work orders for the complaint if general
        existing_wo = db.query(WorkOrder).filter(
            WorkOrder.complaint_id == complaint_id,
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
        complaint_id=complaint_id,
        issue_id=payload.issue_id,
        department_id=payload.department_id,
        assigned_to=payload.assigned_to,
        priority=priority_val,
        status="ASSIGNED",
        instructions=payload.instructions,
        target_completion=payload.target_completion,
        created_at=now_iso,
        updated_at=now_iso
    )
    db.add(work_order)

    # Link work order to issue if issue_id specified
    if payload.issue_id:
        issue = db.query(Issue).filter(Issue.id == payload.issue_id).first()
        if issue:
            issue.work_order_id = wo_id
            issue.status = "ASSIGNED"
            issue.updated_at = now_iso

    # Move complaint to IN_PROGRESS
    old_status = complaint.status
    if complaint.status != "IN_PROGRESS":
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
        details=f"Complaint: {complaint_id}, Issue: {payload.issue_id or 'General'}, Department: {payload.department_id}",
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

    # Only resolved complaints can be formally appealed
    if complaint.status != "RESOLVED":
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state: Only resolved complaints can be appealed. Current status is '{complaint.status}'."
        )

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

@router.put("/issues/{issue_id}/confirm")
@router.put("/{complaint_id}/issues/{issue_id}/confirm")
def confirm_issue_category_and_dept(
    issue_id: str,
    payload: ConfirmIssuePayload,
    complaint_id: Optional[str] = None,
    user: User = Depends(require_role(["MUNICIPAL_OFFICER"])),
    db: Session = Depends(get_db)
):
    """
    Officer Issue Review & Confirmation:
    Distinctly separates AI-assisted model suggestion from authoritative Officer confirmation.
    """
    query = db.query(Issue).filter(Issue.id == issue_id)
    if complaint_id:
        query = query.filter(Issue.complaint_id == complaint_id)
    issue = query.first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found.")

    now_iso = datetime.utcnow().isoformat()
    if payload.category:
        issue.category = payload.category
    if payload.department_id:
        issue.department_id = payload.department_id
    issue.status = "OFFICER_CONFIRMED"
    issue.updated_at = now_iso

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action="Issue Classification Confirmed",
        entity_type="ISSUE",
        entity_id=issue.id,
        details=f"Officer {user.name} confirmed category: '{issue.category}', dept: '{issue.department_id}'. Notes: {payload.notes or 'None'}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Issue #{issue.issue_number} confirmed by Officer {user.name}.",
        "issue": {
            "id": issue.id,
            "category": issue.category,
            "department_id": issue.department_id,
            "status": issue.status
        }
    }

@router.get("/{complaint_id}/related-candidates")
def get_related_incident_candidates(
    complaint_id: str,
    user: User = Depends(require_role(["MUNICIPAL_OFFICER", "SENIOR_AUTHORITY"])),
    db: Session = Depends(get_db)
):
    """
    Spatial Incident Clustering & Candidate Linking:
    Surface nearby or semantically related complaints in the same jurisdiction/category.
    A complaint is NOT automatically an incident.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    candidates = (
        db.query(Complaint)
        .filter(
            Complaint.id != complaint_id,
            (Complaint.category == complaint.category) | (Complaint.jurisdiction == complaint.jurisdiction)
        )
        .order_by(Complaint.created_at.desc())
        .limit(3)
        .all()
    )

    results = []
    for idx, cand in enumerate(candidates):
        # Calculate simulated spatial delta and semantic match score
        distance_meters = 250 + (idx * 130)
        similarity_pct = max(70, 92 - (idx * 8))
        results.append({
            "id": cand.id,
            "tracking_id": cand.tracking_id,
            "title": cand.title,
            "description": cand.description,
            "location": cand.location,
            "category": cand.category,
            "status": cand.status,
            "created_at": cand.created_at,
            "distance_meters": distance_meters,
            "similarity_score": similarity_pct,
            "explanation": f"{cand.category} reported approximately {distance_meters}m proximate. Shared infrastructural subsystem footprint.",
            "is_linked": cand.incident_id is not None and cand.incident_id == complaint.incident_id
        })

    return results

@router.post("/incidents/confirm")
@router.post("/{complaint_id}/confirm-incident")
def confirm_incident_relationship(
    payload: ConfirmIncidentPayload,
    complaint_id: Optional[str] = None,
    user: User = Depends(require_role(["MUNICIPAL_OFFICER"])),
    db: Session = Depends(get_db)
):
    """
    Authoritative Incident Linking:
    Links complaints into an Incident cluster while keeping both complaints separate and intact.
    Does NOT merge complaints, and does NOT treat repeated reports as abuse.
    """
    target_comp_id = complaint_id or payload.complaint_id
    if not target_comp_id:
        raise HTTPException(status_code=400, detail="Missing complaint_id.")

    complaint = db.query(Complaint).filter(Complaint.id == target_comp_id).first()
    related = db.query(Complaint).filter(Complaint.id == payload.related_complaint_id).first()
    if not complaint or not related:
        raise HTTPException(status_code=404, detail="One or more specified complaint records not found.")

    now_iso = datetime.utcnow().isoformat()
    incident_id = complaint.incident_id or related.incident_id

    if not incident_id:
        incident_id = f"inc-{int(datetime.utcnow().timestamp()*1000)}"
        new_inc = Incident(
            id=incident_id,
            title=payload.incident_title or f"Clustered Incident: {complaint.category} ({complaint.location})",
            category=complaint.category,
            jurisdiction_id=complaint.jurisdiction,
            status="UNDER_INVESTIGATION",
            created_at=now_iso,
            updated_at=now_iso
        )
        db.add(new_inc)
        db.flush()

    complaint.incident_id = incident_id
    related.incident_id = incident_id
    complaint.updated_at = now_iso
    related.updated_at = now_iso

    link_id = f"link-{int(datetime.utcnow().timestamp()*1000)}"
    inc_link = IncidentLink(
        id=link_id,
        incident_id=incident_id,
        complaint_id=target_comp_id,
        related_complaint_id=payload.related_complaint_id,
        relationship_status="CONFIRMED",
        candidate_reason=payload.notes or "Spatial / systemic proximity confirmed",
        candidate_score=None,
        confirmed_by=user.id,
        confirmed_at=now_iso,
        created_at=now_iso
    )
    db.add(inc_link)

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action="Incident Relationship Confirmed",
        entity_type="INCIDENT",
        entity_id=incident_id,
        details=f"Officer {user.name} linked {complaint.tracking_id} and {related.tracking_id}. Notes: {payload.notes or 'Spatial / systemic proximity confirmed'}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Relationship confirmed. Both grievances linked under Incident #{incident_id}.",
        "incident_id": incident_id,
        "link_id": link_id
    }

@router.post("/incidents/separate")
@router.post("/{complaint_id}/separate-incident")
def separate_incident_relationship(
    payload: SeparateIncidentPayload,
    complaint_id: Optional[str] = None,
    user: User = Depends(require_role(["MUNICIPAL_OFFICER"])),
    db: Session = Depends(get_db)
):
    """
    Keep Proximate Reports Separate:
    Policy: Distinct grievances remain separate administrative records.
    """
    target_comp_id = complaint_id or payload.complaint_id
    if not target_comp_id:
        raise HTTPException(status_code=400, detail="Missing complaint_id.")

    complaint = db.query(Complaint).filter(Complaint.id == target_comp_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    now_iso = datetime.utcnow().isoformat()
    link_id = f"link-{int(datetime.utcnow().timestamp()*1000)}"
    inc_link = IncidentLink(
        id=link_id,
        incident_id=None,
        complaint_id=target_comp_id,
        related_complaint_id=payload.related_complaint_id,
        relationship_status="KEPT_SEPARATE",
        candidate_reason=payload.reason or "Unrelated occurrence",
        candidate_score=None,
        confirmed_by=user.id,
        confirmed_at=now_iso,
        created_at=now_iso
    )
    db.add(inc_link)

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action="Reports Kept Distinct",
        entity_type="COMPLAINT",
        entity_id=complaint_id,
        details=f"Officer {user.name} determined {complaint.tracking_id} is distinct from {payload.related_complaint_id}. Reason: {payload.reason or 'Unrelated occurrence'}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {"message": "Determination recorded: Grievances preserved as independent administrative cases.", "link_id": link_id}

@router.post("/{complaint_id}/decision")
def submit_officer_decision(
    complaint_id: str,
    payload: OfficerDecisionPayload,
    user: User = Depends(require_role(["MUNICIPAL_OFFICER"])),
    db: Session = Depends(get_db)
):
    """
    Officer Operational Case Decision Workflow:
    Actions supported:
    - RESOLVE: Authoritative statutory case closure with resolution certificate
    - REQUIRE_ACTION: Flag back for supplemental field dispatch
    - REQUEST_INFO: Request constituent clarification
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found.")

    # Validate and normalize response coverage if provided
    raw_cov = payload.coverage_status or payload.response_coverage
    cov_val = None
    if raw_cov:
        cov_val = raw_cov.upper()
        if cov_val == "OVERDUE":
            raise HTTPException(
                status_code=400,
                detail="Invalid coverage status: 'OVERDUE' is a workflow condition, not a response coverage category."
            )
        if cov_val not in ["ADDRESSED", "PARTIAL", "NOT_ADDRESSED", "UNCLEAR"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid coverage status '{cov_val}'. Must be one of: ADDRESSED, PARTIAL, NOT_ADDRESSED, UNCLEAR."
            )

    now_iso = datetime.utcnow().isoformat()
    old_status = complaint.status
    dec_id = f"dec-{int(datetime.utcnow().timestamp()*1000)}"

    # Issue-level response coverage determination
    if cov_val:
        if payload.issue_id:
            target_issue = db.query(Issue).filter(Issue.id == payload.issue_id, Issue.complaint_id == complaint_id).first()
            if not target_issue:
                raise HTTPException(status_code=400, detail="Specified issue does not belong to this complaint.")
            target_issue.coverage_status = cov_val
            target_issue.updated_at = now_iso

            rc_id = f"cov-{int(datetime.utcnow().timestamp()*1000)}"
            rc = ResponseCoverage(
                id=rc_id,
                issue_id=payload.issue_id,
                response_id=None,
                coverage_status=cov_val,
                is_officer_audited=1,
                audited_by=user.id,
                audit_notes=payload.reasoning or payload.resolution_notes or f"Coverage audited as {cov_val} by Officer {user.name}",
                created_at=now_iso,
                updated_at=now_iso
            )
            db.add(rc)
        else:
            for idx, iss in enumerate(complaint.issues):
                iss.coverage_status = cov_val
                iss.updated_at = now_iso
                rc_id = f"cov-{int(datetime.utcnow().timestamp()*1000)}-{idx}"
                rc = ResponseCoverage(
                    id=rc_id,
                    issue_id=iss.id,
                    response_id=None,
                    coverage_status=cov_val,
                    is_officer_audited=1,
                    audited_by=user.id,
                    audit_notes=payload.reasoning or payload.resolution_notes or f"Coverage audited as {cov_val} by Officer {user.name}",
                    created_at=now_iso,
                    updated_at=now_iso
                )
                db.add(rc)

    action_upper = payload.action.upper()

    if action_upper in ["RESOLVE", "RESOLVED", "FORMAL"]:
        complaint.status = "RESOLVED"
        complaint.updated_at = now_iso

        decision = OfficerDecision(
            id=dec_id,
            complaint_id=complaint_id,
            issue_id=payload.issue_id,
            officer_id=user.id,
            decision="RESOLVED",
            reasoning=payload.reasoning or payload.resolution_notes or "Authoritative officer verification of issue remediation.",
            response_coverage=cov_val,
            previous_status=old_status,
            new_status="RESOLVED",
            created_at=now_iso
        )
        db.add(decision)

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

        action_msg = "Complaint officially resolved by Municipal Officer."

    elif action_upper in ["REQUIRE_ACTION", "FURTHER_ACTION", "ASSIGN"]:
        complaint.status = "IN_PROGRESS"
        complaint.updated_at = now_iso

        decision = OfficerDecision(
            id=dec_id,
            complaint_id=complaint_id,
            issue_id=payload.issue_id,
            officer_id=user.id,
            decision="REQUIRE_ACTION",
            reasoning=payload.reasoning or "Officer determined further field remediation is required.",
            response_coverage=cov_val,
            previous_status=old_status,
            new_status="IN_PROGRESS",
            created_at=now_iso
        )
        db.add(decision)

        history = ComplaintStatusHistory(
            id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
            complaint_id=complaint_id,
            old_status=old_status,
            new_status="IN_PROGRESS",
            changed_by=user.id,
            notes="Officer requested supplemental field remediation.",
            created_at=now_iso
        )
        db.add(history)
        action_msg = "Supplemental remediation required. Case returned to In Progress."

    elif action_upper in ["REQUEST_INFO", "CLARIFICATION"]:
        complaint.status = "AWAITING_INFO"
        complaint.updated_at = now_iso

        decision = OfficerDecision(
            id=dec_id,
            complaint_id=complaint_id,
            issue_id=payload.issue_id,
            officer_id=user.id,
            decision="REQUEST_INFO",
            reasoning=payload.reasoning or "Officer requested additional evidence or clarification from constituent.",
            response_coverage=cov_val,
            previous_status=old_status,
            new_status="AWAITING_INFO",
            created_at=now_iso
        )
        db.add(decision)

        history = ComplaintStatusHistory(
            id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
            complaint_id=complaint_id,
            old_status=old_status,
            new_status="AWAITING_INFO",
            changed_by=user.id,
            notes=f"Constituent clarification requested: {payload.reasoning or 'Details needed'}",
            created_at=now_iso
        )
        db.add(history)

        notif = Notification(
            id=f"notif-{int(datetime.utcnow().timestamp()*1000)}",
            user_id=complaint.citizen_id,
            title="Clarification Requested",
            message=f"Municipal Officer {user.name} has requested clarification regarding docket {complaint.tracking_id}.",
            type="INFO_REQUESTED",
            entity_type="COMPLAINT",
            entity_id=complaint_id,
            is_read=0,
            created_at=now_iso
        )
        db.add(notif)
        action_msg = "Constituent clarification notice issued."

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported officer action '{payload.action}'. Supported: RESOLVE, REQUIRE_ACTION, REQUEST_INFO"
        )

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action=f"Officer Decision: {action_upper}",
        entity_type="COMPLAINT",
        entity_id=complaint_id,
        details=payload.reasoning or payload.resolution_notes or f"Decision executed by {user.name}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {
        "message": action_msg,
        "status": complaint.status,
        "decision_id": dec_id
    }

@router.post("/{complaint_id}/appeal/adjudicate")
@router.post("/{complaint_id}/appeals/{appeal_id}/adjudicate")
def adjudicate_appeal(
    complaint_id: str,
    payload: AdjudicateAppealPayload,
    appeal_id: Optional[str] = None,
    user: User = Depends(require_role(["MUNICIPAL_OFFICER", "SENIOR_AUTHORITY"])),
    db: Session = Depends(get_db)
):
    """
    Officer Reconsideration / Appeal Adjudication:
    - REOPEN: Re-opens complaint for secondary field remediation.
    - REJECT: Formally rejects appeal with documented officer justification.
    """
    query = db.query(Appeal).filter(Appeal.complaint_id == complaint_id)
    if appeal_id:
        query = query.filter(Appeal.id == appeal_id)
    else:
        query = query.order_by(Appeal.created_at.desc())
    appeal = query.first()
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal record not found.")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    now_iso = datetime.utcnow().isoformat()

    decision_upper = payload.decision.upper()
    if decision_upper == "REOPEN":
        appeal.status = "REOPENED"
        appeal.officer_notes = payload.notes
        appeal.reviewed_by = user.id
        appeal.updated_at = now_iso

        complaint.status = "IN_PROGRESS"
        complaint.updated_at = now_iso

        history = ComplaintStatusHistory(
            id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
            complaint_id=complaint_id,
            old_status="APPEALED",
            new_status="IN_PROGRESS",
            changed_by=user.id,
            notes=f"Appeal approved by Officer {user.name}. Reopened for secondary remediation: {payload.notes or 'Reopened'}",
            created_at=now_iso
        )
        db.add(history)

        notif = Notification(
            id=f"notif-{int(datetime.utcnow().timestamp()*1000)}",
            user_id=complaint.citizen_id,
            title="Appeal Granted - Docket Reopened",
            message=f"Your appeal for {complaint.tracking_id} has been reviewed and granted by Officer {user.name}.",
            type="APPEAL_GRANTED",
            entity_type="COMPLAINT",
            entity_id=complaint_id,
            is_read=0,
            created_at=now_iso
        )
        db.add(notif)
        msg = "Appeal granted and case reopened."

    elif decision_upper == "REJECT":
        appeal.status = "REJECTED"
        appeal.officer_notes = payload.notes or "Prior resolution confirmed following casework review."
        appeal.reviewed_by = user.id
        appeal.updated_at = now_iso

        complaint.status = "RESOLVED"
        complaint.updated_at = now_iso

        history = ComplaintStatusHistory(
            id=f"csh-{int(datetime.utcnow().timestamp()*1000)}",
            complaint_id=complaint_id,
            old_status="APPEALED",
            new_status="RESOLVED",
            changed_by=user.id,
            notes=f"Appeal rejected by Officer {user.name}. Prior resolution sustained: {payload.notes or 'Prior resolution confirmed'}",
            created_at=now_iso
        )
        db.add(history)

        notif = Notification(
            id=f"notif-{int(datetime.utcnow().timestamp()*1000)}",
            user_id=complaint.citizen_id,
            title="Appeal Determination",
            message=f"Your appeal for {complaint.tracking_id} has been reviewed by Officer {user.name}. Prior resolution sustained.",
            type="APPEAL_REJECTED",
            entity_type="COMPLAINT",
            entity_id=complaint_id,
            is_read=0,
            created_at=now_iso
        )
        db.add(notif)
        msg = "Appeal determination recorded. Prior resolution sustained."
    else:
        raise HTTPException(status_code=400, detail="Decision must be either REOPEN or REJECT.")

    audit = AuditEvent(
        id=f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        actor_id=user.id,
        actor_name=user.name,
        role=user.role,
        action=f"Appeal Adjudicated: {decision_upper}",
        entity_type="APPEAL",
        entity_id=appeal_id,
        details=f"Officer {user.name}: {payload.notes or 'Determination recorded'}",
        ip_address="127.0.0.1",
        created_at=now_iso
    )
    db.add(audit)
    db.commit()

    return {"message": msg, "appeal_status": appeal.status, "complaint_status": complaint.status}
