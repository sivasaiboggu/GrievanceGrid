from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AuditEvent, User
from ..security import get_current_user

router = APIRouter(prefix="/audit-events", tags=["Audit Events"])

@router.get("")
def get_audit_events(
    entity_id: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if entity_id:
        query = query.filter(AuditEvent.entity_id == entity_id)
    elif user.role == "CITIZEN":
        query = query.filter(AuditEvent.actor_id == user.id)

    events = query.order_by(AuditEvent.created_at.desc()).limit(50).all()
    return events
