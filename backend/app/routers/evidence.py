import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..security import get_current_user
from ..models import User, ComplaintAttachment, Complaint
from ..storage import storage_service, UPLOAD_DIR

router = APIRouter(prefix="/evidence", tags=["Evidence"])

@router.post("/upload")
async def upload_evidence(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    result = await storage_service.save_evidence_file(file)
    return result

@router.get("/file/{filename}")
def get_private_evidence_file(
    filename: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    CRITICAL AUTHORIZATION CHECK:
    Private Evidence Access Control:
    - Officer and Field Worker: Allowed to view grievance evidence.
    - Citizen: Only allowed to view evidence attached to their own grievance.
    """
    # Sanitize filename
    clean_filename = os.path.basename(filename)
    file_path = os.path.join(UPLOAD_DIR, clean_filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Evidence file not found in storage vault.")

    # Check database ownership if attachment record exists
    attachment = db.query(ComplaintAttachment).filter(
        ComplaintAttachment.file_url.ilike(f"%{clean_filename}%")
    ).first()

    if attachment:
        complaint = db.query(Complaint).filter(Complaint.id == attachment.complaint_id).first()
        if user.role == "CITIZEN":
            if attachment.uploaded_by != user.id and (not complaint or complaint.citizen_id != user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You do not have permission to inspect private evidence belonging to another citizen."
                )

    return FileResponse(file_path)

@router.get("/{attachment_id}")
def get_attachment_detail(
    attachment_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    att = db.query(ComplaintAttachment).filter(ComplaintAttachment.id == attachment_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment record not found.")

    if user.role == "CITIZEN":
        complaint = db.query(Complaint).filter(Complaint.id == att.complaint_id).first()
        if att.uploaded_by != user.id and (not complaint or complaint.citizen_id != user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have permission to access private evidence of another grievance."
            )

    return {
        "id": att.id,
        "complaint_id": att.complaint_id,
        "file_url": att.file_url,
        "file_name": att.file_name,
        "file_size": att.file_size,
        "mime_type": att.mime_type,
        "sha256_hash": att.sha256_hash,
        "exif_verified": att.exif_verified,
        "provenance_notes": att.provenance_notes,
        "created_at": att.created_at
    }
