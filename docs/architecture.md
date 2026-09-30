# GrievanceGrid Architecture Specification

## Overview

GrievanceGrid is an evidence-aware municipal grievance resolution platform designed to transform unstructured citizen reports into structured, traceable, and verifiable resolution workflows. Rather than treating civic complaints as single opaque text tickets, the platform decomposes complaints into constituent issues, establishes evidentiary provenance, routes work orders to municipal departments, and audits field remediation against specific issue contracts.

---

## High-Level System Architecture

```
                                [ Users ]
         Citizen • Municipal Officer • Field Worker • Senior Authority
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
      [ Mobile Application ]                    [ Web Portal ]
  (React Native / Expo / Hermes)            (Next.js / TypeScript)
               │                                         │
               └────────────────────┬────────────────────┘
                                    │ REST API / JWT
                                    ▼
                         [ FastAPI Gateway ]
                       (Python 3.11+, Uvicorn)
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
[ Auth & RBAC ]          [ Grievance Engine ]         [ Work Order System ]
 • JWT Security           • Multi-issue parser         • SLA timer engine
 • Role boundaries        • Category classification    • Field dispatch
 • Password hashing       • Audit trail logging        • Evidence capture
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    │
                                    ▼
                  [ PostgreSQL 16 + PostGIS + pgvector ]
                   • Authoritative relational records
                   • Geographic geospatial coordinates (SRID 4326)
                   • Vector embeddings for semantic deduplication
                                    │
                   ┌────────────────┴────────────────┐
                   ▼                                 ▼
      [ S3 Object Storage ]                 [ Redis + Celery ]
     • Private evidence vault               • Asynchronous audits
     • SHA-256 integrity hash               • Background notification queue
```

---

## Role & Access Model

The system implements strict server-side Role-Based Access Control (RBAC). The login experience is unified; authenticated credentials determine the authorized role and accessible views:

| Role | Authoritative Scope | Mobile Destination | Web Destination |
| :--- | :--- | :--- | :--- |
| **CITIZEN** | Report complaints, view personal filings, submit feedback/appeals | Citizen Home | Citizen Portal |
| **MUNICIPAL_OFFICER** | Review jurisdiction cases, issue decisions, dispatch work orders | Officer Portal | Officer Dashboard |
| **FIELD_WORKER** | Execute assigned work orders, upload on-ground evidence | Field Worker App | Technician View |
| **SENIOR_AUTHORITY** | High-level municipal SLA oversight, cross-department analytics | Authority Dashboard | Executive Analytics |

Unauthenticated requests receive `HTTP 401 Unauthorized`. Requests attempting cross-role boundary access receive `HTTP 403 Forbidden`.

---

## Data Model & Relationships

```
+----------------+          +-------------------+          +----------------+
|      User      | 1      1 |  CitizenProfile   |          |   Department   |
|----------------|----------|-------------------|          |----------------|
| id (PK)        |          | user_id (FK)      |          | id (PK)        |
| name           |          | address           |          | name           |
| email          |          | ward              |          | code           |
| role           |          | preferred_lang    |          | sla_days       |
+----------------+          +-------------------+          +----------------+
        │ 1                                                        │ 1
        │                                                          │
        │ *                                                        │ *
+----------------+ 1      * +-------------------+ 1      * +----------------+
|   Complaint    |----------|       Issue       |----------|   WorkOrder    |
|----------------|          |-------------------|          |----------------|
| id (PK)        |          | id (PK)           |          | id (PK)        |
| tracking_id    |          | complaint_id (FK) |          | issue_id (FK)  |
| citizen_id (FK)|          | category          |          | department_id  |
| title          |          | priority          |          | assigned_to    |
| status         |          | status            |          | status         |
| location_coords|          +-------------------+          +----------------+
+----------------+
        │ 1
        │ *
+-----------------------+
|  ComplaintAttachment  |
|-----------------------|
| id (PK)               |
| complaint_id (FK)     |
| file_url              |
| sha256_hash           |
+-----------------------+
```

---

## Evidence Integrity Pipeline

1. **Upload**: Citizen captures photograph or video.
2. **Hashing**: SHA-256 cryptographic digest computed on upload.
3. **Storage**: Stored in private, access-controlled object storage.
4. **Linkage**: Digest immutably attached to `ComplaintAttachment` record.
5. **Verification**: Field remediation photos are independently hashed and cross-referenced prior to officer resolution sign-off.
