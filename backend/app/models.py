from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Role(Base):
    __tablename__ = "roles"
    name = Column(String, primary_key=True)
    description = Column(String, nullable=False)
    level = Column(Integer, default=1)

class Department(Base):
    __tablename__ = "departments"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    sla_days = Column(Integer, default=3)
    default_priority = Column(String, default="MEDIUM")
    escalation_hours = Column(Integer, default=72)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class Jurisdiction(Base):
    __tablename__ = "jurisdictions"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    city = Column(String, nullable=False)
    zone_head = Column(String, nullable=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class SlaConfiguration(Base):
    __tablename__ = "sla_configurations"
    id = Column(String, primary_key=True)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    priority = Column(String, nullable=False)
    target_resolution_hours = Column(Integer, nullable=False)
    escalation_threshold_hours = Column(Integer, nullable=False)
    reminder_frequency_hours = Column(Integer, nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, ForeignKey("roles.name"), nullable=False)
    phone = Column(String, nullable=True)
    is_active = Column(Integer, default=1)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

    citizen_profile = relationship("CitizenProfile", back_populates="user", uselist=False)
    officer_profile = relationship("OfficerProfile", back_populates="user", uselist=False)
    worker_profile = relationship("FieldWorkerProfile", back_populates="user", uselist=False)
    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id")

class CitizenProfile(Base):
    __tablename__ = "citizen_profiles"
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    address = Column(String, nullable=True)
    ward = Column(String, nullable=True)
    national_id = Column(String, nullable=True)
    preferred_language = Column(String, default="English")

    user = relationship("User", back_populates="citizen_profile")

class OfficerProfile(Base):
    __tablename__ = "officer_profiles"
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    badge_number = Column(String, nullable=False)
    jurisdiction_id = Column(String, ForeignKey("jurisdictions.id"), nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    designation = Column(String, nullable=False)

    user = relationship("User", back_populates="officer_profile")

class FieldWorkerProfile(Base):
    __tablename__ = "field_worker_profiles"
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    skill_set = Column(String, nullable=False)
    status = Column(String, default="AVAILABLE")

    user = relationship("User", back_populates="worker_profile")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    jurisdiction_id = Column(String, ForeignKey("jurisdictions.id"), nullable=True)
    status = Column(String, default="OPEN")  # OPEN, UNDER_INVESTIGATION, RESOLVED
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

    complaints = relationship("Complaint", back_populates="incident")

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(String, primary_key=True)
    tracking_id = Column(String, unique=True, nullable=False)
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    priority = Column(String, default="MEDIUM")
    status = Column(String, default="SUBMITTED")
    assigned_department = Column(String, ForeignKey("departments.id"), nullable=True)
    jurisdiction = Column(String, ForeignKey("jurisdictions.id"), nullable=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True)
    deadline = Column(String, nullable=True)
    sub_issues_count = Column(Integer, default=1)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    incident = relationship("Incident", back_populates="complaints")
    issues = relationship("Issue", back_populates="complaint", cascade="all, delete-orphan")
    attachments = relationship("ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="complaint", cascade="all, delete-orphan")
    decisions = relationship("OfficerDecision", back_populates="complaint", cascade="all, delete-orphan")

class Issue(Base):
    __tablename__ = "issues"
    id = Column(String, primary_key=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    issue_number = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="SUBMITTED")
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    work_order_id = Column(String, ForeignKey("work_orders.id", use_alter=True, name="fk_issue_work_order"), nullable=True)
    coverage_status = Column(String, default="PENDING")  # PENDING, ADDRESSED, PARTIAL, NOT_ADDRESSED, UNCLEAR
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

    complaint = relationship("Complaint", back_populates="issues")
    coverages = relationship("ResponseCoverage", back_populates="issue", cascade="all, delete-orphan")

class ComplaintAttachment(Base):
    __tablename__ = "complaint_attachments"
    id = Column(String, primary_key=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String, nullable=True)
    sha256_hash = Column(String, nullable=True)
    exif_verified = Column(Integer, default=1)
    synthetic_risk_score = Column(Float, default=0.0)
    provenance_notes = Column(Text, nullable=True)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(String, nullable=False)

    complaint = relationship("Complaint", back_populates="attachments")

class WorkOrder(Base):
    __tablename__ = "work_orders"
    id = Column(String, primary_key=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=True)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    priority = Column(String, default="MEDIUM")
    status = Column(String, default="ASSIGNED")  # ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    instructions = Column(Text, nullable=True)
    target_completion = Column(String, nullable=True)
    completed_at = Column(String, nullable=True)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

    complaint = relationship("Complaint", back_populates="work_orders")
    responses = relationship("WorkOrderResponse", back_populates="work_order", cascade="all, delete-orphan")

class WorkOrderResponse(Base):
    __tablename__ = "work_order_responses"
    id = Column(String, primary_key=True)
    work_order_id = Column(String, ForeignKey("work_orders.id"), nullable=False)
    worker_id = Column(String, ForeignKey("users.id"), nullable=False)
    response_text = Column(Text, nullable=False)
    photo_url = Column(String, nullable=True)
    photo_sha256 = Column(String, nullable=True)
    created_at = Column(String, nullable=False)

    work_order = relationship("WorkOrder", back_populates="responses")

class ResponseCoverage(Base):
    __tablename__ = "response_coverages"
    id = Column(String, primary_key=True)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    response_id = Column(String, ForeignKey("work_order_responses.id"), nullable=True)
    coverage_status = Column(String, nullable=False)  # ADDRESSED, PARTIAL, NOT_ADDRESSED, UNCLEAR
    ai_suggested_label = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    is_officer_audited = Column(Integer, default=0)
    audited_by = Column(String, ForeignKey("users.id"), nullable=True)
    audit_notes = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

    issue = relationship("Issue", back_populates="coverages")

class OfficerDecision(Base):
    __tablename__ = "officer_decisions"
    id = Column(String, primary_key=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=True)
    officer_id = Column(String, ForeignKey("users.id"), nullable=False)
    decision = Column(String, nullable=False)  # RESOLVED, REQUIRE_ACTION, REQUEST_INFO, REJECTED, REASSIGNED
    reasoning = Column(Text, nullable=False)
    response_coverage = Column(String, nullable=True)  # ADDRESSED, PARTIAL, NOT_ADDRESSED, UNCLEAR
    previous_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    created_at = Column(String, nullable=False)

    complaint = relationship("Complaint", back_populates="decisions")

class IncidentLink(Base):
    __tablename__ = "incident_links"
    id = Column(String, primary_key=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    related_complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    relationship_status = Column(String, nullable=False)  # CANDIDATE, CONFIRMED, KEPT_SEPARATE
    candidate_reason = Column(Text, nullable=True)
    candidate_score = Column(Float, nullable=True)
    confirmed_by = Column(String, ForeignKey("users.id"), nullable=True)
    confirmed_at = Column(String, nullable=True)
    created_at = Column(String, nullable=False)

class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"
    id = Column(String, primary_key=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    changed_by = Column(String, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)
    entity_type = Column(String, nullable=True)
    entity_id = Column(String, nullable=True)
    is_read = Column(Integer, default=0)
    created_at = Column(String, nullable=False)

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(String, primary_key=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)

class Appeal(Base):
    __tablename__ = "appeals"
    id = Column(String, primary_key=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, REOPENED, REJECTED
    officer_notes = Column(Text, nullable=True)
    reviewed_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(String, primary_key=True)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False)
    actor_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, default="127.0.0.1")
    created_at = Column(String, nullable=False)

class PasswordReset(Base):
    __tablename__ = "password_resets"
    id = Column(String, primary_key=True)
    contact = Column(String, nullable=False)
    otp_code = Column(String, nullable=False)
    reset_token = Column(String, nullable=True)
    is_verified = Column(Integer, default=0)
    expires_at = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
