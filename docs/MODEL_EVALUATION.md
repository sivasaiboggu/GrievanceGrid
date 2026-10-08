# GrievanceGrid: Model Evaluation Metrics & Benchmarking Protocol

This document outlines the formal evaluation protocols, performance metrics, and evaluation reporting guidelines for GrievanceGrid's machine learning components.

---

## 1. Truthful Reporting Guidelines

- **No Fabricated Metrics**: Unmeasured performance numbers must never be generated. Modules pending experimental execution are designated **"Pending Benchmark"** or **"Experimental"**.
- **Per-Class Granularity**: Aggregate macro averages must be accompanied by per-class precision and recall metrics to detect minority category failure modes.

---

## 2. Evaluation Metrics by Task

### 2.1 Issue Extraction (Token-Level BIO Tagging)
- **Token Precision & Recall**: Precision and recall of extracted civic entity tokens.
- **Exact-Span F1**: String-level boundary agreement on extracted issue description phrases.
- **Missed Issues Rate**: Fraction of citizen complaints where at least one secondary issue was overlooked.

### 2.2 Complaint Category Classification
- **Accuracy**: Overall fraction of correctly categorized dockets.
- **Macro-F1 & Weighted-F1**: Balanced performance metric across skewed municipal classes (e.g., frequent road complaints vs rare health hazards).
- **Confusion Matrix**: Inspection of cross-department misclassification (e.g., stormwater drainage vs road flooding).

### 2.3 Incident Candidate Linking
- **Link Precision & Recall**: Accuracy of predicting shared infrastructural failures across complaints.
- **False-Link Rate**: Rate at which independent occurrences are incorrectly recommended for clustering.

### 2.4 Response Coverage Auditing
- **Per-Class Metrics**: Precision, Recall, and F1 for `ADDRESSED`, `PARTIAL`, `NOT_ADDRESSED`, and `UNCLEAR`.
- **False-Addressed Rate**: Critical safety metric evaluating the frequency with which incomplete work is mistakenly predicted as `ADDRESSED`.
- **Macro-F1**: Harmonic mean across all four coverage classes.

---

## 3. Dataset Leakage Prevention Protocol

- **Strict Temporal & Spatial Splits**: Training, validation, and test splits are partitioned across distinct time windows and municipal wards to prevent spatial autocorrelation leakage.
- **Synthetic Sample Isolation**: Paraphrased or augmented samples are confined to training splits only and marked with `synthetic = true`. Benchmark evaluation is performed exclusively on held-out human-annotated data.
