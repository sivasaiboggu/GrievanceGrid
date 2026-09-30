from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Department, Jurisdiction, SlaConfiguration, User
from ..security import get_current_user

router = APIRouter(tags=["Reference & Configuration"])

CATEGORIES = [
    {"id": "cat-1", "name": "Road Damage", "description": "Potholes, asphalt erosion, pavement cave-in, road cracks"},
    {"id": "cat-2", "name": "Streetlight Issues", "description": "Broken streetlights, flickering lamps, exposed junction cables"},
    {"id": "cat-3", "name": "Garbage & Waste", "description": "Uncollected municipal waste, overflowing bins, illegal dumping"},
    {"id": "cat-4", "name": "Drainage & Sewage", "description": "Blocked storm drains, open manholes, sewage overflow"},
    {"id": "cat-5", "name": "Water Supply", "description": "Pipeline bursts, low pressure, contaminated water supply"},
    {"id": "cat-6", "name": "Traffic & Road Obstructions", "description": "Fallen trees, waterlogging, construction debris blocking roads"},
    {"id": "cat-7", "name": "Public Infrastructure Damage", "description": "Damaged bus stops, missing tactile pavers, compromised signage"},
    {"id": "cat-8", "name": "Sanitation & Public Cleanliness", "description": "Public toilet sanitation, stagnant water pools, vector hazards"}
]

@router.get("/categories")
def get_categories():
    return CATEGORIES

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).filter(Department.is_active == 1).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "sla_days": d.sla_days,
            "default_priority": d.default_priority,
            "escalation_hours": d.escalation_hours
        }
        for d in depts
    ]

@router.get("/jurisdictions")
def get_jurisdictions(db: Session = Depends(get_db)):
    juris = db.query(Jurisdiction).filter(Jurisdiction.is_active == 1).all()
    return [
        {
            "id": j.id,
            "name": j.name,
            "code": j.code,
            "city": j.city,
            "zone_head": j.zone_head
        }
        for j in juris
    ]

@router.get("/sla-configs")
def get_sla_configs(db: Session = Depends(get_db)):
    configs = db.query(SlaConfiguration).all()
    return [
        {
            "id": c.id,
            "department_id": c.department_id,
            "priority": c.priority,
            "target_resolution_hours": c.target_resolution_hours,
            "escalation_threshold_hours": c.escalation_threshold_hours,
            "reminder_frequency_hours": c.reminder_frequency_hours
        }
        for c in configs
    ]

@router.get("/field-workers")
def get_field_workers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workers = db.query(User).filter(User.role == "FIELD_WORKER", User.is_active == 1).all()
    return [
        {
            "id": w.id,
            "name": w.name,
            "email": w.email,
            "role": w.role,
            "phone": w.phone
        }
        for w in workers
    ]
