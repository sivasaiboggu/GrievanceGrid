# GrievanceGrid: Evidence-Aware Civic Complaint and Resolution Platform

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18%2F19-61DAFB.svg)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86+-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020.svg)](https://expo.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20PostGIS%20%2B%20pgvector-336791.svg)](https://www.postgresql.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Local%20Fallback-003B57.svg)](https://www.sqlite.org/)

> **Academic Context & Disclaimer**  
> GrievanceGrid is an academic research prototype developed as part of the B.Tech in Computer Science and Engineering programme at the **Indian Institute of Information Technology, Kottayam (IIIT Kottayam)**. It investigates evidence-aware civic grievance understanding, multi-issue decomposition, work-order dispatching, and issue-level resolution auditing. It is not an official government portal, does not claim official government endorsement, and is not an official CPGRAMS deployment.

---

## 1. Project Overview

GrievanceGrid is an evidence-aware municipal civic grievance reporting and authoritative resolution platform. It transitions municipal grievance handling from monolithic, ticket-based workflows to evidence-grounded, multi-issue contracts with strict human-in-the-loop accountability.

---

## 2. Problem Statement

Municipal grievance redressal platforms encounter core systemic issues:
1. **Compound Grievances**: A single citizen grievance frequently combines multiple distinct failures (e.g., collapsed storm drain, uncollected waste, broken streetlights). Monolithic tickets route to one department, leaving secondary hazards ignored.
2. **Unstructured Narrative Text**: Citizen descriptions vary in clarity, emotion, and precision, complicating triage and response.
3. **Incomplete or Misattributed Evidence**: Photographs may be ambiguous or unverified.
4. **Redundant Incident Dockets**: Clustered infrastructure failures cause duplicate tickets across neighborhoods.
5. **Superficial Work Order Closure**: Field technician completion is too often equated with complaint resolution, bypassing verification.
6. **Lack of Human-in-the-Loop Oversight**: Purely automated systems risk misclassifying emergency infrastructure failures without officer accountability.

---

## 3. Objectives

- **Multi-Issue Decomposition**: Disentangle composite citizen reports into verifiable, discrete issue units.
- **Cryptographic Evidence Provenance**: Secure evidence with SHA-256 integrity digests, timestamping, and access control.
- **Authoritative Human-in-the-Loop Decisioning**: Guarantee that automated model predictions remain decision-support recommendations, requiring officer review and sign-off.
- **Enforced Verification Separation**: Enforce that `Field Worker Completion ≠ Complaint Resolution`. Field completion triggers officer verification before resolution.
- **Auditable Municipal Governance**: Provide immutable status history, audit trails, and administrative oversight.

---

## 4. Key Features

- **Multi-Issue Citizen Intake**: 4-step guided submission wizard with category selection, geo-tagging, and evidence attachment.
- **Precinct Operations Desk (Officer Web & Mobile)**: Comprehensive triage queue, issue category confirmation, incident clustering, work order dispatch, and formal decision adjudication.
- **On-Ground Field Execution (Mobile App)**: Mobile interface for field staff to receive work orders, start work, and submit remediation evidence for officer audit.
- **Administrative Governance (Authority Web & Mobile)**: Read-only jurisdictional overview, department-level SLA monitoring, and case surveillance.
- **Citizen Appeal & Reconsideration**: Formal reconsideration mechanism when remediations fall short of citizen expectations.
- **Cryptographic Integrity Vault**: SHA-256 verification and restricted access controls protecting private grievance evidence.

---

## 5. Architecture

GrievanceGrid operates with strict separation between desktop governance web applications and on-ground field/citizen mobile applications, backed by an authoritative FastAPI core:

```
[ Web Clients ]                               [ Mobile Clients ]
• Citizen Web (Mobile-First Web)              • Citizen Mobile (Expo/React Native)
• Municipal Officer Web (Desktop Portal)      • Municipal Officer Mobile
• Senior Authority Web (Governance Portal)    • Field Worker Mobile (On-Ground)
• Field Worker (Guidance / Mismatch View)
                     │                                │
                     └─────────────────┬──────────────┘
                                       ▼
                       [ FastAPI Core Service ]
                       Prefixes: /api and /api/v1
                                       │
     ┌───────────────────┬─────────────┴─────────────┬──────────────────┐
     ▼                   ▼                           ▼                  ▼
[ Auth & RBAC ]  [ Case Lifecycle ]          [ Work Orders ]     [ Evidence Vault ]
JWT Bearer Auth  Intake → Review → Decision   Dispatch & Audit    SHA-256 & Local/S3
     │                   │                           │                  │
     └───────────────────┴─────────────┬─────────────┴──────────────────┘
                                       ▼
                        [ Relational Storage Engine ]
                  PostgreSQL 16 (PostGIS, pgvector) / SQLite
```

---

## 6. Web Application

Built with React 18, TypeScript, and Vite. Designed desktop-first for administrative roles and responsive for citizens:
- **Citizen Web**: Clean reporting wizard, active case tracking, notifications, and profile management.
- **Municipal Officer Web (`OfficerDashboard.tsx`)**: Desktop-first operations desk with sidebar navigation, live KPI counters, complaint filtering, issue confirmation, incident grouping, work order dispatch, and formal resolution decisions.
- **Senior Authority Web (`AuthorityDashboard.tsx`)**: High-level administrative oversight, KPI verification, recent docket audits, and cross-department monitoring.
- **Field Worker Web Guidance**: Informational portal mismatch screen directing field staff to the dedicated mobile application.

---

## 7. Mobile Application

Built with React Native and Expo (SDK 57):
- **Citizen Mobile**: On-device grievance creation, camera evidence capture, tracking timeline, and appeals.
- **Municipal Officer Mobile**: On-the-go triage queue, evidence provenance review, incident linking, work order dispatch, and decision screens.
- **Field Worker Mobile**: Active work order inspection, execution status transitions (`IN_PROGRESS`), and completion report submission (`SUBMITTED FOR VERIFICATION`).
- **Senior Authority Mobile**: Executive case metrics and department monitoring.

---

## 8. Backend

Powered by FastAPI (Python 3.11+):
- **Authentication**: JWT token issuance with bcrypt password hashing and server-side RBAC enforcement.
- **Case Lifecycle**: Formal state engine enforcing valid status transitions (`SUBMITTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `AWAITING_VERIFICATION` $\rightarrow$ `RESOLVED` / `APPEALED`).
- **Work Orders**: Idempotent dispatch, conflict prevention, and response coverage verification.
- **Dual Endpoint Mount**: Routers mounted under both `/api` and `/api/v1` for universal API compatibility.

---

## 9. AI/ML Components

- **Issue Extraction**: Assistive segmentation of complex citizen narratives into individual issue units.
- **Similarity & Clustering**: Spatial buffer proximity and category linking recommendations.
- **Evidence Signal Analysis**: Multimodal integrity and synthetic risk indicators.
- **Semantics Policy**: AI outputs are strictly treated as **decision-support recommendations** requiring authorized officer review. Model confidence is never presented as objective truth or automatic adjudication.

---

## 10. Evidence-Aware Workflow

The platform maintains strict separation across evidentiary states:
```
Evidence Uploaded  ≠  Evidence Verified  ≠  Resolution Approved
```

1. **Submission**: Citizen uploads photograph; SHA-256 hash computed and recorded.
2. **Triage**: Municipal officer inspects evidence and confirms decomposed issues.
3. **Dispatch**: Officer dispatches work order to departmental field worker.
4. **Field Submission**: Field worker captures remediation photograph and submits completion report. Complaint moves to `AWAITING_VERIFICATION`.
5. **Officer Verification**: Officer audits coverage status (`ADDRESSED`, `PARTIAL`, `NOT_ADDRESSED`, `UNCLEAR`).
6. **Decision**: Officer executes formal `RESOLVE`, `REQUIRE_ACTION`, or `REQUEST_INFO` decision.

---

## 11. Role Matrix

| Role | Web Experience | Mobile Experience | Main Responsibilities |
| :--- | :--- | :--- | :--- |
| **CITIZEN** | Full Experience | Full Experience | Submit grievances, track progress, provide evidence, submit appeals |
| **MUNICIPAL_OFFICER** | Officer Dashboard | Officer Portal | Review complaints, confirm issues, cluster incidents, dispatch work orders, verify evidence, issue resolution decisions |
| **FIELD_WORKER** | Mobile Guidance Page | Field Worker App | Receive dispatches, update field progress, upload remediation proof, submit for verification |
| **SENIOR_AUTHORITY** | Authority Dashboard | Authority Screen | Jurisdictional governance, SLA compliance, cross-department trends, case monitoring |

---

## 12. API Overview

Key backend endpoints supported under `/api` and `/api/v1`:

### Authentication & Profiles
- `POST /api/v1/auth/login` — Authenticate and receive JWT bearer token.
- `POST /api/v1/auth/register` — Register citizen account.
- `GET /api/v1/auth/me` — Retrieve authenticated user profile and role.

### Complaints & Officer Casework
- `GET /api/v1/complaints` — Paginated complaint queue with role filtering.
- `POST /api/v1/complaints` — Citizen grievance creation with decomposed issues.
- `GET /api/v1/complaints/{id}` — Full complaint detail, issues, history, work orders, appeals.
- `GET /api/v1/complaints/officer/overview` — Live KPI metrics and actionable dockets.
- `PUT /api/v1/complaints/issues/{issue_id}/confirm` — Officer confirmation of issue classification.
- `POST /api/v1/complaints/incidents/confirm` — Authoritative linking of complaints into an incident cluster.
- `POST /api/v1/complaints/incidents/separate` — Authoritative decision to keep proximate complaints distinct.
- `POST /api/v1/complaints/{id}/decision` — Officer resolution decision (`RESOLVE`, `REQUIRE_ACTION`, `REQUEST_INFO`).
- `POST /api/v1/complaints/{id}/appeal` — Citizen appeal submission.
- `POST /api/v1/complaints/{id}/appeal/adjudicate` — Officer/Authority appeal adjudication (`REOPEN` / `REJECT`).

### Work Orders
- `GET /api/v1/work-orders` — Work orders filtered by status, complaint, or assigned technician.
- `POST /api/v1/work-orders` — Dispatch work order with duplicate prevention.
- `PUT /api/v1/work-orders/{id}/start` — Mark work order as `IN_PROGRESS`.
- `POST /api/v1/work-orders/{id}/complete` — Submit field completion and transition complaint to `AWAITING_VERIFICATION`.
- `POST /api/v1/work-orders/{id}/verify` — Officer response coverage audit.

### Evidence & Storage
- `POST /api/v1/evidence/upload` — Upload evidence file with MIME validation and SHA-256 digest.
- `GET /api/v1/evidence/file/{filename}` — Access-controlled private evidence retrieval.

---

## 13. Database Overview

The relational database architecture is defined in `backend/app/models.py`:
- `User`, `Role`, `CitizenProfile`, `OfficerProfile`, `FieldWorkerProfile`
- `Department`, `Jurisdiction`, `SlaConfiguration`
- `Complaint`, `Issue`, `ComplaintAttachment`, `ComplaintStatusHistory`
- `Incident`, `IncidentLink`, `WorkOrder`, `WorkOrderResponse`, `ResponseCoverage`
- `OfficerDecision`, `Appeal`, `Notification`, `AuditEvent`

---

## 14. Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker for PostgreSQL + PostGIS container

### Repository Setup
```bash
git clone https://github.com/sivasaiboggu/GrievanceGrid.git
cd GrievanceGrid
```

---

## 15. Running Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Health Check: `http://localhost:8000/api/v1/health`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

---

## 16. Running Web Client

```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 17. Running Mobile Application

```bash
cd mobile
npm install
npx expo start
```
For native Android testing via ADB:
```bash
adb reverse tcp:8000 tcp:8000
npx expo run:android
```

---

## 18. Testing

Execute the complete backend test suite:
```bash
cd backend
uv run --with-requirements requirements.txt --with pytest --with httpx pytest
```
*Result: 12 passed in 13.57s.*

Verify client TypeScript build:
```bash
cd client
npm run build
```
*Result: 0 errors; production bundle built cleanly.*

---

## 19. Demo Accounts (Development & Evaluation)

For local evaluation, the database auto-seeds the following test accounts:

| Role | Email | Password | Intended Portal |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@grievancegrid.gov.in` | `Password123!` | Web / Mobile Citizen Interface |
| **Municipal Officer** | `officer@grievancegrid.gov.in` | `Password123!` | Web Officer Dashboard / Mobile Portal |
| **Field Worker** | `worker@grievancegrid.gov.in` | `Password123!` | Mobile Field Worker Application |
| **Senior Authority** | `authority@grievancegrid.gov.in` | `Password123!` | Web Authority Dashboard / Mobile Screen |

---

## 20. Limitations

- **Research Scope**: Developed as an academic prototype at IIIT Kottayam; not a live production municipal deployment.
- **Live Integrations**: Operates standalone; does not connect directly to live CPGRAMS or external CRM servers.
- **Dataset Scale**: Evaluated on controlled experimental scenarios and simulated urban precinct datasets.

---

## 21. Future Work

- Integration of multi-lingual speech-to-text for vernacular voice grievance intake.
- Automated spatial recurrence clustering over multi-year longitudinal road maintenance data.
- Formal zero-knowledge proof verification for anonymous whistle-blower grievance disclosures.

---

## 22. Project Structure

```
GrievanceGrid/
├── backend/
│   ├── app/
│   │   ├── routers/        # auth, complaints, evidence, work_orders, audit, reference
│   │   ├── config.py       # Pydantic environment configuration
│   │   ├── database.py     # SQLAlchemy engine, session maker, SQLite/Postgres switch
│   │   ├── main.py         # FastAPI application entry point, dual prefix mounts
│   │   ├── models.py       # Complete relational database models
│   │   ├── schemas.py      # Pydantic validation schemas
│   │   ├── security.py     # JWT token and password hash helpers
│   │   ├── seed.py         # Institutional seed accounts and test dockets
│   │   └── storage.py      # SHA-256 cryptographic evidence vault
│   ├── tests/              # Authoritative pytest integration test suites
│   └── requirements.txt    # Python dependencies
├── client/
│   ├── src/
│   │   ├── api/            # API client wrapper
│   │   ├── components/
│   │   │   ├── auth/       # Stitch login screen with role presets
│   │   │   ├── authority/  # Senior Authority governance dashboard
│   │   │   ├── citizen/    # Citizen home, wizard, tracking, notifications
│   │   │   ├── common/     # AccessStates (403, 401, wrong portal guidance)
│   │   │   └── officer/    # Municipal Officer desktop operational dashboard
│   │   ├── context/        # AuthContext provider
│   │   ├── types/          # TypeScript interface definitions
│   │   ├── App.tsx         # Central role-based application router
│   │   └── index.css       # Design tokens and theme styling
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── api.js          # React Native API client
│   │   ├── screens/        # Auth, Citizen, Officer, Authority, and FieldWorker screens
│   │   │   └── officer/    # Modular officer tabs, review modals, and decision views
│   │   └── theme.js        # Color palette, spacing, and typography
│   ├── App.js              # Central React Native router and session manager
│   └── package.json
├── docs/                   # Architecture, development setup, and release audits
└── docker-compose.yml      # Local PostgreSQL, PostGIS, pgvector, Redis stack
```
