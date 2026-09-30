from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime

# Auth Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str = "CITIZEN"

class UserCreate(UserBase):
    password: str
    ward: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfileOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    ward: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    user: Any

class ForgotPasswordRequest(BaseModel):
    email: Optional[str] = None
    contact: Optional[str] = None

class VerifyOtpRequest(BaseModel):
    contact: Optional[str] = None
    email: Optional[str] = None
    code: str

class ResetPasswordRequest(BaseModel):
    contact: Optional[str] = None
    email: Optional[str] = None
    resetToken: Optional[str] = None
    newPassword: str

# Issue Schemas
class IssueCreate(BaseModel):
    category: str
    description: str

class IssueOut(BaseModel):
    id: str
    complaint_id: str
    issue_number: int
    category: str
    description: str
    status: str
    coverage_status: Optional[str] = "PENDING"
    created_at: str

    class Config:
        from_attributes = True

# Evidence Attachment Schemas
class AttachmentCreate(BaseModel):
    url: str
    name: str
    size: Optional[int] = 0
    mimeType: Optional[str] = "image/jpeg"
    sha256_hash: Optional[str] = None
    exif_verified: Optional[bool] = True
    synthetic_risk_score: Optional[float] = 0.02
    provenance_notes: Optional[str] = None

class AttachmentOut(BaseModel):
    id: str
    complaint_id: str
    file_url: str
    file_name: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    sha256_hash: Optional[str] = None
    exif_verified: Optional[int] = 1
    synthetic_risk_score: Optional[float] = 0.0
    provenance_notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

# Complaint Schemas
class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    jurisdiction_id: Optional[str] = "jur-1"
    attachments: Optional[List[AttachmentCreate]] = []
    issues: Optional[List[IssueCreate]] = []

class ComplaintOut(BaseModel):
    id: str
    tracking_id: str
    citizen_id: str
    title: str
    description: str
    category: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    priority: str
    status: str
    assigned_department: Optional[str] = None
    jurisdiction: Optional[str] = None
    deadline: Optional[str] = None
    sub_issues_count: Optional[int] = 1
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class ComplaintDetailOut(BaseModel):
    complaint: Any
    issues: List[IssueOut]
    attachments: List[AttachmentOut]
    history: List[Any]
    workOrders: List[Any]
    evidence: List[Any]
    feedback: Optional[Any] = None
    appeals: List[Any]

# Feedback Schema
class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None

# Appeal Schema
class AppealCreate(BaseModel):
    reason: str = Field(..., min_length=10)

# Notification Schema
class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    is_read: int
    created_at: str

    class Config:
        from_attributes = True
