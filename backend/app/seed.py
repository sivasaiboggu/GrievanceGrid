from datetime import datetime
from sqlalchemy.orm import Session
from .models import (
    Role, Department, Jurisdiction, SlaConfiguration, User,
    CitizenProfile, OfficerProfile, FieldWorkerProfile,
    Complaint, Issue, ComplaintAttachment, ComplaintStatusHistory, AuditEvent
)
from .security import get_password_hash

CATEGORIES = [
    "Road Damage",
    "Streetlight Issues",
    "Garbage & Waste",
    "Drainage & Sewage",
    "Water Supply",
    "Traffic & Road Obstructions",
    "Public Infrastructure Damage",
    "Sanitation & Public Cleanliness"
]

def seed_data_if_empty(db: Session):
    # Check if already seeded
    if db.query(Role).count() > 0:
        return

    print("Seeding initial municipal platform data into PostgreSQL / SQLite...")

    # 1. Roles
    roles = [
        Role(name="CITIZEN", description="Citizen reporting grievances and tracking public services", level=1),
        Role(name="FIELD_WORKER", description="Field technical staff executing on-ground work orders and providing evidentiary updates", level=2),
        Role(name="MUNICIPAL_OFFICER", description="Administrative municipal authority responsible for review, assignment, verification and resolution", level=3),
        Role(name="SENIOR_AUTHORITY", description="Senior administrative and monitoring executive with oversight across all departments", level=4),
    ]
    db.add_all(roles)
    db.flush()

    # 2. Departments
    depts = [
        Department(id="dept-1", name="Roads & Infrastructure Maintenance", code="ROADS", sla_days=4, default_priority="HIGH", escalation_hours=48),
        Department(id="dept-2", name="Sanitation & Solid Waste Management", code="SAN", sla_days=2, default_priority="MEDIUM", escalation_hours=24),
        Department(id="dept-3", name="Water Supply & Sewerage Board", code="WATER", sla_days=3, default_priority="HIGH", escalation_hours=36),
        Department(id="dept-4", name="Public Electrical & Street Lighting", code="ELEC", sla_days=2, default_priority="MEDIUM", escalation_hours=24),
        Department(id="dept-5", name="Stormwater Drainage & Flood Control", code="DRAIN", sla_days=3, default_priority="HIGH", escalation_hours=36),
        Department(id="dept-6", name="Public Health & Vector Control", code="HEALTH", sla_days=3, default_priority="MEDIUM", escalation_hours=48),
    ]
    db.add_all(depts)
    db.flush()

    # 3. Jurisdictions
    juris = [
        Jurisdiction(id="jur-1", name="Central Administrative Zone", code="ZONE-C", city="Metro Municipal Area", zone_head="Zonal Commissioner R. Mehta"),
        Jurisdiction(id="jur-2", name="North Industrial Zone", code="ZONE-N", city="Metro Municipal Area", zone_head="Zonal Commissioner K. Verma"),
        Jurisdiction(id="jur-3", name="South Residential Zone", code="ZONE-S", city="Metro Municipal Area", zone_head="Zonal Commissioner A. Rao"),
        Jurisdiction(id="jur-4", name="East Tech Corridor", code="ZONE-E", city="Metro Municipal Area", zone_head="Zonal Commissioner S. Gupta"),
    ]
    db.add_all(juris)
    db.flush()

    # 4. SLA Configurations
    sla_data = [
        ("sla-roads-urgent", "dept-1", "URGENT", 24, 18, 6),
        ("sla-roads-high",   "dept-1", "HIGH", 48, 36, 12),
        ("sla-roads-med",    "dept-1", "MEDIUM", 96, 72, 24),
        ("sla-roads-low",    "dept-1", "LOW", 144, 120, 24),
        ("sla-san-urgent",   "dept-2", "URGENT", 12, 8, 4),
        ("sla-san-high",     "dept-2", "HIGH", 24, 18, 6),
        ("sla-san-med",      "dept-2", "MEDIUM", 48, 36, 12),
        ("sla-san-low",      "dept-2", "LOW", 72, 48, 24),
        ("sla-water-urgent", "dept-3", "URGENT", 12, 8, 4),
        ("sla-water-high",   "dept-3", "HIGH", 36, 24, 8),
        ("sla-water-med",    "dept-3", "MEDIUM", 72, 48, 12),
        ("sla-water-low",    "dept-3", "LOW", 120, 96, 24),
        ("sla-elec-urgent",  "dept-4", "URGENT", 12, 8, 4),
        ("sla-elec-high",    "dept-4", "HIGH", 24, 18, 6),
        ("sla-elec-med",     "dept-4", "MEDIUM", 48, 36, 12),
        ("sla-elec-low",     "dept-4", "LOW", 72, 48, 24),
        ("sla-drain-urgent", "dept-5", "URGENT", 12, 8, 4),
        ("sla-drain-high",   "dept-5", "HIGH", 36, 24, 8),
        ("sla-drain-med",    "dept-5", "MEDIUM", 72, 48, 12),
        ("sla-drain-low",    "dept-5", "LOW", 120, 96, 24),
        ("sla-health-urgent","dept-6", "URGENT", 18, 12, 6),
        ("sla-health-high",  "dept-6", "HIGH", 36, 24, 8),
        ("sla-health-med",   "dept-6", "MEDIUM", 72, 48, 12),
        ("sla-health-low",   "dept-6", "LOW", 96, 72, 24)
    ]
    for s_id, d_id, prio, target, esc, rem in sla_data:
        db.add(SlaConfiguration(
            id=s_id, department_id=d_id, priority=prio,
            target_resolution_hours=target, escalation_threshold_hours=esc, reminder_frequency_hours=rem
        ))
    db.flush()

    # 5. Users
    pwd_hash = get_password_hash("Password123!")
    now_iso = datetime.utcnow().isoformat()

    users = [
        User(id="user-citizen-1", name="Arjun Sharma", email="citizen@grievancegrid.gov.in", password_hash=pwd_hash, role="CITIZEN", phone="+91 98765 43210", is_active=1, created_at=now_iso, updated_at=now_iso),
        User(id="user-citizen-2", name="Meera Nair", email="meera.nair@example.com", password_hash=pwd_hash, role="CITIZEN", phone="+91 98111 22334", is_active=1, created_at=now_iso, updated_at=now_iso),
        User(id="user-officer-1", name="Priya Deshmukh", email="officer@grievancegrid.gov.in", password_hash=pwd_hash, role="MUNICIPAL_OFFICER", phone="+91 94230 11223", is_active=1, created_at=now_iso, updated_at=now_iso),
        User(id="user-worker-1", name="Ramesh Kumar", email="worker@grievancegrid.gov.in", password_hash=pwd_hash, role="FIELD_WORKER", phone="+91 91234 56789", is_active=1, created_at=now_iso, updated_at=now_iso),
        User(id="user-authority-1", name="Commissioner S. Ramanathan", email="authority@grievancegrid.gov.in", password_hash=pwd_hash, role="SENIOR_AUTHORITY", phone="+91 99000 11222", is_active=1, created_at=now_iso, updated_at=now_iso),
    ]
    db.add_all(users)
    db.flush()

    # 6. Profiles
    c_profile = CitizenProfile(user_id="user-citizen-1", address="Flat 402, Royal Palms, 8th Main, Ward 14", ward="Ward 14 (Central)", national_id="IND-CIT-8821", preferred_language="English")
    c_profile2 = CitizenProfile(user_id="user-citizen-2", address="House 19, Green Avenue, Ward 09", ward="Ward 09 (South)", national_id="IND-CIT-3490", preferred_language="English")
    o_profile = OfficerProfile(user_id="user-officer-1", badge_number="MUNI-OFF-4021", jurisdiction_id="jur-1", department_id="dept-1", designation="Superintendent Grievance Officer")
    w_profile = FieldWorkerProfile(user_id="user-worker-1", department_id="dept-1", skill_set="Road Maintenance & Surface Patching", status="AVAILABLE")
    db.add_all([c_profile, c_profile2, o_profile, w_profile])
    db.flush()

    # 7. Initial Seed Complaints with Decomposed Issues
    comp1 = Complaint(
        id="comp-1",
        tracking_id="GG-2026-004812",
        citizen_id="user-citizen-1",
        title="Severe asphalt cratering & structural fissure on 4th Main",
        description="Deep hazardous pothole causing vehicular traffic snarls near primary school.",
        category="Road Damage",
        location="4th Main Road, Sector 3, Ward 14",
        latitude=12.9716,
        longitude=77.5946,
        priority="HIGH",
        status="RESOLVED",
        assigned_department="dept-1",
        jurisdiction="jur-1",
        deadline="2026-08-18T18:00:00.000Z",
        sub_issues_count=1,
        created_at="2026-08-14T10:15:00.000Z",
        updated_at="2026-08-17T16:00:00.000Z"
    )
    iss1 = Issue(
        id="iss-1-1",
        complaint_id="comp-1",
        issue_number=1,
        category="Road Damage",
        description="Deep hazardous pothole causing vehicular traffic snarls",
        status="RESOLVED",
        department_id="dept-1",
        coverage_status="ADDRESSED",
        created_at="2026-08-14T10:15:00.000Z",
        updated_at="2026-08-17T16:00:00.000Z"
    )

    comp2 = Complaint(
        id="comp-2",
        tracking_id="GG-2026-005193",
        citizen_id="user-citizen-1",
        title="Clogged primary storm drain and pedestrian walkway flood",
        description="Silt and debris clogging storm drain causing severe road flooding and impassable pedestrian walkway.",
        category="Drainage & Sewage",
        location="Crossroad 8, Industrial Suburb, Ward 14",
        latitude=12.9780,
        longitude=77.6010,
        priority="HIGH",
        status="AWAITING_VERIFICATION",
        assigned_department="dept-5",
        jurisdiction="jur-1",
        deadline="2026-09-22T12:00:00.000Z",
        sub_issues_count=2,
        created_at="2026-09-18T09:30:00.000Z",
        updated_at="2026-09-20T11:00:00.000Z"
    )
    iss2_1 = Issue(
        id="iss-2-1",
        complaint_id="comp-2",
        issue_number=1,
        category="Drainage & Sewage",
        description="Silt and debris clogging primary storm drain line",
        status="AWAITING_VERIFICATION",
        department_id="dept-5",
        coverage_status="PENDING",
        created_at="2026-09-18T09:30:00.000Z",
        updated_at="2026-09-20T11:00:00.000Z"
    )
    iss2_2 = Issue(
        id="iss-2-2",
        complaint_id="comp-2",
        issue_number=2,
        category="Traffic & Road Obstructions",
        description="Waterlogging overflowing onto pedestrian walkway",
        status="AWAITING_VERIFICATION",
        department_id="dept-1",
        coverage_status="PENDING",
        created_at="2026-09-18T09:30:00.000Z",
        updated_at="2026-09-20T11:00:00.000Z"
    )

    comp3 = Complaint(
        id="comp-3",
        tracking_id="GG-2026-005401",
        citizen_id="user-citizen-1",
        title="Non-functional LED high-mast assembly on 12th Ave",
        description="Streetlights completely out along a 400-meter stretch.",
        category="Streetlight Issues",
        location="12th Avenue, Green Garden Colony, Ward 14",
        latitude=12.9820,
        longitude=77.5890,
        priority="MEDIUM",
        status="IN_PROGRESS",
        assigned_department="dept-4",
        jurisdiction="jur-1",
        deadline="2026-09-24T18:00:00.000Z",
        sub_issues_count=1,
        created_at="2026-09-20T14:20:00.000Z",
        updated_at="2026-09-21T09:00:00.000Z"
    )
    iss3_1 = Issue(
        id="iss-3-1",
        complaint_id="comp-3",
        issue_number=1,
        category="Streetlight Issues",
        description="Non-functional LED high-mast assembly on 12th Ave",
        status="IN_PROGRESS",
        department_id="dept-4",
        coverage_status="PENDING",
        created_at="2026-09-20T14:20:00.000Z",
        updated_at="2026-09-21T09:00:00.000Z"
    )

    db.add_all([comp1, iss1, comp2, iss2_1, iss2_2, comp3, iss3_1])
    db.flush()

    # Initial Status History & Audit Events
    h1 = ComplaintStatusHistory(id="csh-1", complaint_id="comp-1", old_status="SUBMITTED", new_status="RESOLVED", changed_by="user-officer-1", notes="Remediation audited and verified by Municipal Officer", created_at="2026-08-17T16:00:00.000Z")
    aud1 = AuditEvent(id="aud-init-1", actor_id="user-citizen-1", actor_name="Arjun Sharma", role="CITIZEN", action="Complaint Created", entity_type="COMPLAINT", entity_id="comp-1", details="Filed under Road Damage", ip_address="127.0.0.1", created_at="2026-08-14T10:15:00.000Z")
    db.add_all([h1, aud1])

    db.commit()
    print("Initial seed completed successfully.")
