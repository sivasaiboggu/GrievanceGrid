# GrievanceGrid: API Specification

**Base URLs:**
- Unversioned: `/api`
- Versioned: `/api/v1`

All protected endpoints require HTTP Bearer token authentication in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Health & System
- `GET /api/v1/health`
  - Response: `{"status": "HEALTHY", "service": "GrievanceGrid Civic Resolution API", "database": "CONNECTED"}`
- `GET /docs` — Interactive Swagger/OpenAPI documentation.

---

## 2. Authentication & Users
- `POST /api/v1/auth/login`
  - Request: `{"email": "...", "password": "..."}`
  - Response: `{"token": "...", "user": {"id": "...", "name": "...", "email": "...", "role": "..."}}`
- `POST /api/v1/auth/register`
  - Request: `{"name": "...", "email": "...", "password": "...", "phone": "...", "role": "CITIZEN"}`
  - Response: `{"message": "Citizen registered successfully", "user": {...}}`
- `GET /api/v1/auth/me`
  - Requires: Bearer Token
  - Response: `{"user": {...}, "profile": {...}}`

---

## 3. Complaints & Case Management
- `POST /api/v1/complaints`
  - Requires Role: `CITIZEN`
  - Request: `{"title": "...", "description": "...", "category": "...", "location": "...", "latitude": ..., "longitude": ..., "issues": [{"category": "...", "description": "..."}], "attachments": [...]}`
  - Response: `{"message": "Grievance lodged successfully", "id": "...", "tracking_id": "GG-2026-..."}`
- `GET /api/v1/complaints`
  - Query Params: `status`, `category`, `search`, `page`, `page_size`
  - Response: `{"complaints": [...], "total": ..., "page": ..., "page_size": ...}`
- `GET /api/v1/complaints/{id}`
  - Response: `{"complaint": {...}, "issues": [...], "attachments": [...], "history": [...], "workOrders": [...], "evidence": [...], "appeals": [...]}`
- `PUT /api/v1/complaints/{id}/triage`
  - Requires Role: `MUNICIPAL_OFFICER`
  - Request: `{"department_id": "...", "priority": "HIGH", "deadline": "..."}`
- `POST /api/v1/complaints/{id}/feedback`
  - Requires Role: `CITIZEN` (owner)
  - Request: `{"rating": 1-5, "comments": "..."}`
- `POST /api/v1/complaints/{id}/appeal`
  - Requires Role: `CITIZEN` (owner)
  - Request: `{"reason": "..."}`

---

## 4. Officer Operational Endpoints
- `GET /api/v1/complaints/officer/overview`
  - Requires Role: `MUNICIPAL_OFFICER` or `SENIOR_AUTHORITY`
  - Response: `{"stats": {"needs_triage": ..., "in_progress": ..., "awaiting_verification": ..., "appeals": ..., "total_active": ...}, "needs_attention": [...], "recent_dockets": [...]}`
- `PUT /api/v1/complaints/issues/{issue_id}/confirm` (or `PUT /api/v1/complaints/{complaint_id}/issues/{issue_id}/confirm`)
  - Requires Role: `MUNICIPAL_OFFICER`
  - Request: `{"category": "...", "department_id": "...", "notes": "..."}`
  - Response: `{"message": "Issue confirmed...", "issue": {...}}`
- `GET /api/v1/complaints/{id}/related-candidates`
  - Requires Role: `MUNICIPAL_OFFICER` or `SENIOR_AUTHORITY`
  - Response: `[{"id": "...", "tracking_id": "...", "distance_meters": ..., "similarity_score": ..., "explanation": "..."}]`
- `POST /api/v1/complaints/incidents/confirm` (or `POST /api/v1/complaints/{id}/confirm-incident`)
  - Requires Role: `MUNICIPAL_OFFICER`
  - Request: `{"complaint_id": "...", "related_complaint_id": "...", "incident_title": "...", "notes": "..."}`
  - Response: `{"message": "Relationship confirmed...", "incident_id": "...", "link_id": "..."}`
- `POST /api/v1/complaints/incidents/separate` (or `POST /api/v1/complaints/{id}/separate-incident`)
  - Requires Role: `MUNICIPAL_OFFICER`
  - Request: `{"complaint_id": "...", "related_complaint_id": "...", "reason": "..."}`
  - Response: `{"message": "Reports marked distinct", "link_id": "..."}`
- `POST /api/v1/complaints/{id}/decision`
  - Requires Role: `MUNICIPAL_OFFICER`
  - Request: `{"action": "RESOLVE|REQUIRE_ACTION|REQUEST_INFO", "resolution_notes": "...", "coverage_status": "ADDRESSED|PARTIAL|NOT_ADDRESSED|UNCLEAR", "issue_id": "..."}`
  - Response: `{"message": "...", "status": "...", "decision_id": "..."}`
- `POST /api/v1/complaints/{id}/appeal/adjudicate` (or `POST /api/v1/complaints/{id}/appeals/{appeal_id}/adjudicate`)
  - Requires Role: `MUNICIPAL_OFFICER` or `SENIOR_AUTHORITY`
  - Request: `{"decision": "REOPEN|REJECT", "notes": "..."}`
  - Response: `{"message": "...", "appeal_status": "...", "complaint_status": "..."}`

---

## 5. Work Orders & Field Dispatch
- `GET /api/v1/work-orders`
  - Query Params: `status`, `complaint_id`
  - Field Workers receive only orders assigned to their account.
- `POST /api/v1/work-orders`
  - Requires Role: `MUNICIPAL_OFFICER`
  - Request: `{"complaint_id": "...", "issue_id": "...", "department_id": "...", "assigned_to": "...", "instructions": "...", "priority": "..."}`
  - Idempotent: Rejects duplicate active dispatches for same issue.
- `PUT /api/v1/work-orders/{id}/start`
  - Requires Role: `FIELD_WORKER` (assigned) or `MUNICIPAL_OFFICER`
  - Transitions work order to `IN_PROGRESS`.
- `POST /api/v1/work-orders/{id}/complete`
  - Requires Role: `FIELD_WORKER` (assigned) or `MUNICIPAL_OFFICER`
  - Request: `{"remarks": "...", "photo_url": "...", "photo_sha256": "..."}`
  - Enforces: Transitions complaint to `AWAITING_VERIFICATION` (not `RESOLVED`).
- `POST /api/v1/work-orders/{id}/verify`
  - Requires Role: `MUNICIPAL_OFFICER`
  - Request: `{"coverage_status": "ADDRESSED|PARTIAL|NOT_ADDRESSED|UNCLEAR", "verification_notes": "..."}`

---

## 6. Evidence & Uploads
- `POST /api/v1/evidence/upload`
  - Multi-part form upload. Allowed types: JPEG, PNG, WEBP, HEIC, PDF. Max size: 10 MB.
  - Response: `{"url": "/api/evidence/file/...", "name": "...", "size": ..., "sha256_hash": "...", "provenance_notes": "..."}`
- `GET /api/v1/evidence/file/{filename}`
  - Private access check: Citizens can only download evidence attached to their own complaint. Officers/workers can access case evidence.
