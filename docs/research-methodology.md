# GrievanceGrid Research Methodology

## Research Context

- **Institution**: Indian Institute of Information Technology, Kottayam (IIIT Kottayam)
- **Programme**: B.Tech in Computer Science and Engineering
- **Focus**: Evidence-Aware Municipal Grievance Understanding, Multi-Issue Decomposition, and Response Auditing

---

## 1. Research Question

> **"How can AI assist in understanding, connecting, and evaluating civic grievances by analysing individual issues, multimodal evidence, related reports, and resolution responses?"**

Civic grievance redressal systems frequently struggle with unstructured citizen reports containing multiple distinct municipal problems (e.g., a burst pipe that also caused a roadway crater and exposed an electrical wire). Treating such submissions as monolithic tickets results in misclassification, incomplete dispatch, and premature closure.

---

## 2. Core Research Contributions

### 1. Evidence-Provenance Incident Graph
Constructs a graph connecting citizen reports, decomposed issues, verified photographic attachments (indexed by cryptographic hashes), geographic coordinates, and departmental jurisdictions. This facilitates cross-complaint deduplication and incident clustering.

### 2. Cross-Modal Evidence Conflict & Uncertainty Detection
Evaluates the consistency between textual problem descriptions and photographic evidence submitted by citizens or field teams. Highlights potential discrepancies for human officer review rather than automated rejection.

### 3. Issue-Specific Resolution Contract & Response Audit
Breaks down a complaint into an enforceable contract of discrete issues. Field worker remediation reports and closure photographs are audited against each specific issue, preventing cases from being marked resolved when only a subset of issues were remediated.

### 4. Post-Resolution Recurrence Analysis
Monitors spatial and temporal recurrence of complaints in identical jurisdictions post-closure to identify systemic infrastructure defects and audit long-term contractor remediation quality.

---

## 3. Human-in-the-Loop & Responsible AI Principles

1. **AI as Decision Support**: Machine learning models suggest categories, highlight candidate duplicates, and flag potential evidence discrepancies. All final administrative determinations (dispatch, verification, resolution, rejection) are made by authorized human officers.
2. **Confidence, Not Certainty**: Classification probabilities and similarity scores are treated as confidence indicators, not factual certainties.
3. **Auditability**: Every model inference, officer review, and worker update is immutably recorded in the `audit_events` ledger with actor identities, timestamps, and IP addresses.

---

## 4. Planned Datasets & Evaluation Metrics

### Datasets
- **Public Service Datasets**: NYC 311 Service Requests (benchmarking category distribution and dispatch SLAs).
- **Computer Vision Benchmarks**: RDD2022 (Road Damage Dataset) and TACO (Trash Annotations in Context) for visual evidence models.
- **Municipal Demonstration Data**: Synthetic and permissioned civic grievances with multi-issue annotations.

### Planned Evaluation Metrics
- **Category Classification**: Precision, Recall, Macro-F1.
- **Issue Decomposition**: Precision, Recall, Exact-Span F1, Missed Issue Rate.
- **Incident Clustering**: Precision, Recall, False-Link Rate.
- **Response Coverage Audit**: Precision, Recall, F1, and False "Addressed" Rate.
