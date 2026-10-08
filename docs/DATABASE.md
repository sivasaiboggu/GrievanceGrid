# GrievanceGrid: Database Schema & Data Models

GrievanceGrid uses **SQLAlchemy 2.0** ORM backed primarily by **PostgreSQL 16** with **PostGIS** and **pgvector** extensions, and incorporates a local **SQLite** fallback probe for development environments without running Docker containers.

---

## 1. Schema Extensions
- **PostGIS 3.4.3**: Geographic coordinate storage, spatial buffer queries, and spatial proximity calculations (`SRID 4326`).
- **pgvector 0.8.6**: High-dimensional dense vector embeddings for semantic grievance retrieval and clustering.

---

## 2. Core Entities & Relationships

### 2.1 Identity & Organizations
- `Role`: System security roles (`CITIZEN`, `MUNICIPAL_OFFICER`, `FIELD_WORKER`, `SENIOR_AUTHORITY`) with hierarchy level (1–4).
- `User`: Central credential record (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `is_active`, `created_at`, `updated_at`).
- `CitizenProfile`: One-to-one extension with resident `address`, `ward`, `national_id`.
- `OfficerProfile`: One-to-one extension with `badge_number`, `jurisdiction_id`, `department_id`, `designation`.
- `FieldWorkerProfile`: One-to-one extension with `department_id`, `skill_set`, `status` (`AVAILABLE`/`DISPATCHED`).
- `Department`: Municipal functional branch (`ROADS`, `SAN`, `WATER`, `ELEC`, `DRAIN`, `HEALTH`) with `sla_days` and `escalation_hours`.
- `Jurisdiction`: Administrative zonal boundary (`ZONE-C`, `ZONE-N`, `ZONE-S`, `ZONE-E`).
- `SlaConfiguration`: Departmental SLA matrix mapping priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) to `target_resolution_hours`.

### 2.2 Case Lifecycle & Decomposition
- `Complaint`: Primary grievance docket.
  - Fields: `id`, `tracking_id` (e.g. `GG-2026-004812`), `citizen_id`, `title`, `description`, `category`, `location`, `latitude`, `longitude`, `priority`, `status`, `assigned_department`, `jurisdiction`, `incident_id`, `deadline`, `sub_issues_count`, `created_at`, `updated_at`.
- `Issue`: Decomposed sub-issue contract.
  - Fields: `id`, `complaint_id`, `issue_number`, `category`, `description`, `department_id`, `priority`, `status` (`SUBMITTED`, `OFFICER_CONFIRMED`, `AWAITING_VERIFICATION`, `RESOLVED`), `coverage_status` (`ADDRESSED`, `PARTIAL`, `NOT_ADDRESSED`, `UNCLEAR`), `created_at`, `updated_at`.
- `ComplaintAttachment`: Evidentiary file metadata.
  - Fields: `id`, `complaint_id`, `file_url`, `file_name`, `file_size`, `mime_type`, `sha256_hash`, `exif_verified`, `uploaded_by`, `provenance_notes`, `created_at`.
- `ComplaintStatusHistory`: Immutable audit history of case lifecycle transitions.

### 2.3 Incident Graph
- `Incident`: Clustered neighborhood failure across multiple complaints.
  - Fields: `id`, `title`, `category`, `jurisdiction_id`, `status` (`UNDER_INVESTIGATION`, `IN_PROGRESS`, `RESOLVED`), `created_at`, `updated_at`.
- `IncidentLink`: Association linking complaints to incident clusters or marking them distinct.
  - Fields: `id`, `incident_id` (nullable), `complaint_id`, `related_complaint_id`, `relationship_status` (`CONFIRMED`, `KEPT_SEPARATE`), `candidate_reason`, `confirmed_by`, `confirmed_at`.

### 2.4 Work Orders & Resolution Verification
- `WorkOrder`: Departmental execution dispatch.
  - Fields: `id`, `complaint_id`, `issue_id`, `department_id`, `assigned_to` (field worker), `priority`, `status` (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), `instructions`, `target_completion`, `completed_at`, `created_at`, `updated_at`.
- `WorkOrderResponse`: Field technician completion report.
  - Fields: `id`, `work_order_id`, `worker_id`, `response_text`, `photo_url`, `photo_sha256`, `created_at`.
- `ResponseCoverage`: Authoritative audit of remediation against specific issue contract.
  - Fields: `id`, `issue_id`, `response_id`, `coverage_status` (`ADDRESSED`, `PARTIAL`, `NOT_ADDRESSED`, `UNCLEAR`), `is_officer_audited`, `audited_by`, `audit_notes`, `created_at`, `updated_at`.
- `OfficerDecision`: Formal municipal resolution certification.
  - Fields: `id`, `complaint_id`, `issue_id`, `officer_id`, `decision` (`RESOLVED`, `REQUIRE_ACTION`, `REQUEST_INFO`), `reasoning`, `response_coverage`, `previous_status`, `new_status`, `created_at`.
- `Appeal`: Citizen reconsideration petition.
  - Fields: `id`, `complaint_id`, `citizen_id`, `reason`, `status` (`PENDING`, `REOPENED`, `REJECTED`), `reviewed_by`, `officer_notes`, `created_at`, `updated_at`.

### 2.5 Governance & Tracking
- `Notification`: In-app notification queue (`id`, `user_id`, `title`, `message`, `type`, `entity_type`, `entity_id`, `is_read`, `created_at`).
- `AuditEvent`: Institutional tamper-evident log (`id`, `actor_id`, `actor_name`, `role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`).
