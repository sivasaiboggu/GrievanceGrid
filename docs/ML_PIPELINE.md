# GrievanceGrid: Machine Learning Pipeline Architecture

This document describes the design, task decomposition, and fallback mechanisms of the assistive machine learning modules in GrievanceGrid.

---

## 1. Core Operating Principle: Assistive Decision Support

```
AI Output  ──►  Confidence Signal  ──►  Human Officer Review  ──►  Authoritative Decision
```
- No machine learning prediction is ever executed as an autonomous government action.
- All predictions (category suggestions, extracted sub-issues, duplicate incident candidates, response coverage labels) are presented as **decision-support recommendations** requiring authorized officer confirmation.
- If any ML module fails or is offline, the core case management workflow continues uninterrupted via manual officer review.

---

## 2. Pipeline Components

### 2.1 Multi-Issue Extraction & Text Segmentation
- **Task**: Disentangle unstructured constituent narrative text into discrete municipal issue units.
- **Model Architecture**:
  - Baseline: TF-IDF feature extraction with One-vs-Rest Logistic Regression.
  - Advanced: IndicBERTv2 fine-tuned with BIO (Beginning-Inside-Outside) token tagging for multi-issue span extraction.
- **Output**: Ranked candidate issue spans and predicted categories.

### 2.2 Semantic Retrieval & Spatial Proximity Linking
- **Task**: Identify proximate or semantically identical grievances across the precinct for incident candidate clustering.
- **Model Architecture**: `paraphrase-multilingual-MiniLM-L12-v2` generating 384-dimensional dense semantic vectors stored in `pgvector`.
- **Linking Heuristic**: Logistic regression classifier evaluating spatial buffer distance (meters) combined with cosine semantic similarity score.
- **Policy**: High similarity generates a **candidate incident link**; it never automatically merges dockets. The officer explicitly confirms or separates.

### 2.3 Visual Defect Screening & Image Analysis
- **Task**: Image analysis of citizen evidence photographs for infrastructure category screening.
- **Model Architecture**: EfficientNet-B0 backbone with transfer learning heads for civic hazard classes (pothole, waste pile, waterlogging, broken luminaire).
- **Integrity Signals**: Automated screening provides metadata consistency indicators and synthetic content risk flags. It explicitly requires manual officer review and does not claim categorical authenticity proof.

### 2.4 Response Coverage Auditing
- **Task**: Evaluate whether post-remediation field photographs and work order reports satisfy the original constituent issue contract.
- **Model Architecture**: Cross-encoder text/evidence classifier evaluating issue descriptions alongside technician notes.
- **Allowed Class Labels**: `ADDRESSED`, `PARTIAL`, `NOT_ADDRESSED`, `UNCLEAR`.
- **Policy**: Missing evidence is classified as `UNCLEAR` (never automatically defaulted to `NOT_ADDRESSED`). An authorized Municipal Officer reviews and signs off on the final coverage determination.
