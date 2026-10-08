# GrievanceGrid: Research Contributions Mapping

This document maps the academic research contributions to the repository's backend, frontend, database, and test suite implementations.

---

## 1. Research Contribution 1: Evidence-Provenance Incident Graph
- **Description**: A spatial-semantic graph connecting citizen complaints, decomposed issue nodes, cryptographic evidence hashes, and departmental jurisdictions to identify clustered neighborhood infrastructure failures without destructive ticket merging.
- **Backend Implementation**:
  - `Incident`, `IncidentLink` models in `backend/app/models.py`.
  - Spatial proximity linking endpoint `GET /api/v1/complaints/{id}/related-candidates` in `backend/app/routers/complaints.py`.
  - Authoritative clustering endpoints `POST /api/v1/complaints/incidents/confirm` and `POST /api/v1/complaints/incidents/separate`.
- **Frontend / Mobile Implementation**:
  - Related candidates review card in `OfficerDashboard.tsx` and `OfficerPortalScreen.js`.
- **Test Evidence**:
  - `test_incident_linking_and_separation` in `backend/tests/test_officer_phase2a.py`.

---

## 2. Research Contribution 2: Cross-Modal Evidence Conflict & Uncertainty Detection
- **Description**: Assistive cross-referencing between citizen narrative text descriptions, EXIF capture parameters, and uploaded visual evidence to flag discrepancies and uncertainty indicators for human caseworkers.
- **Backend Implementation**:
  - `ComplaintAttachment.sha256_hash` and `ComplaintAttachment.provenance_notes` in `backend/app/models.py`.
  - Upload digest generation in `backend/app/storage.py`.
  - Private evidence access enforcement in `backend/app/routers/evidence.py`.
- **Frontend / Mobile Implementation**:
  - Cryptographic hash viewer and metadata consistency panel in `OfficerEvidenceReviewScreen.js` and `OfficerDashboard.tsx`.
- **Test Evidence**:
  - `test_evidence_privacy_and_authorization` in `backend/tests/test_authoritative_workflow.py`.

---

## 3. Research Contribution 3: Issue-Specific Resolution Contract & Response Audit
- **Description**: Decomposition of monolithic complaint tickets into discrete, traceable sub-issue contracts with explicit response coverage auditing (`ADDRESSED`, `PARTIAL`, `NOT_ADDRESSED`, `UNCLEAR`) before official resolution sign-off.
- **Backend Implementation**:
  - `Issue` and `ResponseCoverage` models in `backend/app/models.py`.
  - Issue confirmation endpoint `PUT /api/v1/complaints/issues/{issue_id}/confirm`.
  - Response verification endpoint `POST /api/v1/work-orders/{id}/verify` in `backend/app/routers/work_orders.py`.
  - Officer resolution decision endpoint `POST /api/v1/complaints/{id}/decision` in `backend/app/routers/complaints.py`.
- **Frontend / Mobile Implementation**:
  - Decomposed issue cards and coverage selector in `OfficerDashboard.tsx` and `OfficerDecisionScreen.js`.
- **Test Evidence**:
  - `test_officer_issue_review_and_confirmation`, `test_response_coverage_hardening_and_overdue_rejection`, and `test_officer_decision_and_appeal_adjudication` in `backend/tests/test_officer_phase2a.py`.

---

## 4. Research Contribution 4: Post-Resolution Recurrence Analysis & Citizen Appeal Loop
- **Description**: Longitudinal monitoring of post-resolution failure patterns and citizen dissatisfaction, supported by a formal appeal and reconsideration mechanism.
- **Backend Implementation**:
  - `Appeal` model in `backend/app/models.py`.
  - Citizen appeal endpoint `POST /api/v1/complaints/{id}/appeal`.
  - Officer appeal adjudication endpoint `POST /api/v1/complaints/{id}/appeal/adjudicate` (`REOPEN` / `REJECT`).
- **Frontend / Mobile Implementation**:
  - Appeal lodging wizard in citizen view and adjudication review in `OfficerDashboard.tsx` and `OfficerPortalScreen.js`.
- **Test Evidence**:
  - `test_appeal_rejection_lifecycle` in `backend/tests/test_officer_phase2a.py`.
