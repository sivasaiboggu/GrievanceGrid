#!/usr/bin/env python3
"""
GrievanceGrid Category Classification Baseline
===============================================
TF-IDF + One-vs-Rest Logistic Regression baseline for complaint category classification.

Usage:
    python ml/baselines/category_classifier_tfidf.py \
        --data datasets/processed/nyc311/train.json \
        --output ml/reports/tfidf_baseline_report.json

Requirements:
    pip install scikit-learn pandas numpy tqdm
"""

import os
import sys
import json
import pickle
import hashlib
import argparse
import warnings
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

warnings.filterwarnings("ignore")

# GrievanceGrid complaint categories
CATEGORIES = [
    "Road Damage",
    "Streetlight Issues",
    "Garbage & Waste",
    "Drainage & Sewage",
    "Water Supply",
    "Traffic & Road Obstructions",
    "Public Infrastructure Damage",
    "Sanitation & Public Cleanliness",
]

# NYC 311 → GrievanceGrid category mapping
NYC311_CATEGORY_MAP = {
    "Pothole": "Road Damage",
    "Street Light Condition": "Streetlight Issues",
    "Dirty Condition": "Garbage & Waste",
    "Sewer": "Drainage & Sewage",
    "Street Flooding": "Drainage & Sewage",
    "Water System": "Water Supply",
    "Traffic Signal Condition": "Traffic & Road Obstructions",
    "Sidewalk Condition": "Public Infrastructure Damage",
    "Noise - Street/Sidewalk": "Traffic & Road Obstructions",
}


def load_nyc311_data(data_path: str, category_map: Dict[str, str]) -> tuple:
    """Load and filter NYC 311 data, mapping to GrievanceGrid categories."""
    try:
        import pandas as pd
    except ImportError:
        print("ERROR: pandas not installed. Run: pip install pandas")
        sys.exit(1)

    path = Path(data_path)
    if not path.exists():
        print(f"ERROR: Data file not found: {data_path}")
        print("Run: python scripts/datasets/download_nyc311.py first")
        sys.exit(1)

    print(f"Loading data from {data_path}...")
    if path.suffix == ".json":
        with open(path) as f:
            raw_data = json.load(f)
        df = pd.DataFrame(raw_data)
    elif path.suffix == ".csv":
        df = pd.read_csv(path, low_memory=False)
    else:
        raise ValueError(f"Unsupported file format: {path.suffix}")

    print(f"Raw records: {len(df)}")

    # Map categories
    df["gg_category"] = df.get("complaint_type", df.get("Complaint Type", "")).map(category_map)
    df = df[df["gg_category"].notna()].copy()

    # Use descriptor or complaint text
    text_col = None
    for col in ["descriptor", "Descriptor", "description", "complaint_type"]:
        if col in df.columns:
            text_col = col
            break

    if text_col is None:
        print("ERROR: No text column found in dataset")
        sys.exit(1)

    df["text"] = df[text_col].fillna("").astype(str)
    df = df[df["text"].str.len() > 5].copy()

    texts = df["text"].tolist()
    labels = df["gg_category"].tolist()

    print(f"Usable records after filtering: {len(texts)}")
    print(f"Category distribution:")
    for cat in CATEGORIES:
        count = labels.count(cat)
        pct = count / len(labels) * 100 if labels else 0
        print(f"  {cat}: {count} ({pct:.1f}%)")

    return texts, labels


def train_tfidf_baseline(texts: List[str], labels: List[str], output_dir: str, random_seed: int = 42):
    """Train TF-IDF + Logistic Regression baseline."""
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.multiclass import OneVsRestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import (
            precision_recall_fscore_support,
            classification_report,
            confusion_matrix,
        )
        from sklearn.preprocessing import LabelBinarizer
        import numpy as np
    except ImportError:
        print("ERROR: scikit-learn not installed. Run: pip install scikit-learn numpy")
        sys.exit(1)

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    print("\nSplitting dataset...")
    # Use stratified split to maintain category balance
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.15, random_state=random_seed, stratify=labels
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.118, random_state=random_seed, stratify=y_train
    )  # ~10% of original

    print(f"Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    print(f"Split methodology: Stratified random split maintaining category proportions")
    print(f"WARNING: NYC 311 is a US city dataset. Domain gap with Indian municipal data.")

    print("\nFitting TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2,
        max_df=0.95,
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_val_tfidf = vectorizer.transform(X_val)
    X_test_tfidf = vectorizer.transform(X_test)

    print("Training One-vs-Rest Logistic Regression...")
    classifier = LogisticRegression(
        C=1.0, max_iter=1000, random_state=random_seed, solver="lbfgs"
    )
    model = OneVsRestClassifier(classifier)
    lb = LabelBinarizer()

    y_train_bin = lb.fit_transform(y_train)
    model.fit(X_train_tfidf, y_train_bin)

    # Validation evaluation
    y_val_pred_bin = model.predict(X_val_tfidf)
    y_val_pred = lb.inverse_transform(y_val_pred_bin)

    # Test evaluation
    y_test_pred_bin = model.predict(X_test_tfidf)
    y_test_pred = lb.inverse_transform(y_test_pred_bin)

    print("\n=== BASELINE EVALUATION RESULTS ===")
    print(f"Model: TF-IDF + One-vs-Rest Logistic Regression")
    print(f"Dataset: NYC 311 (US city data — domain gap with Indian complaints)")
    print(f"Test set size: {len(X_test)}")

    classes_present = list(set(y_test))
    p, r, f, _ = precision_recall_fscore_support(
        y_test, y_test_pred, labels=classes_present, average="macro", zero_division=0
    )
    print(f"\nMacro-averaged (test set):")
    print(f"  Precision: {p:.4f}")
    print(f"  Recall:    {r:.4f}")
    print(f"  F1:        {f:.4f}")

    print("\nPer-class results (test set):")
    print(classification_report(y_test, y_test_pred, zero_division=0))

    cm = confusion_matrix(y_test, y_test_pred, labels=classes_present)

    # Error analysis
    errors = [(X_test[i], y_test[i], y_test_pred[i])
               for i in range(len(y_test))
               if y_test[i] != y_test_pred[i]][:20]

    timestamp = datetime.utcnow().isoformat()

    report = {
        "model_name": "TF-IDF + One-vs-Rest Logistic Regression",
        "model_version": "1.0.0",
        "dataset": "nyc311",
        "dataset_version": "2020_2024",
        "pipeline_version": "1.0.0",
        "training_timestamp": timestamp,
        "random_seed": random_seed,
        "split": {"train": len(X_train), "val": len(X_val), "test": len(X_test)},
        "split_methodology": "Stratified random split — temporal leakage possible in NYC 311",
        "domain_warning": (
            "NYC 311 is US city data. Results do NOT generalize to Indian municipal "
            "complaints without domain adaptation. These are baseline numbers only."
        ),
        "metrics": {
            "macro_precision": round(float(p), 4),
            "macro_recall": round(float(r), 4),
            "macro_f1": round(float(f), 4),
        },
        "per_class_metrics": {},
        "confusion_matrix": {
            "labels": classes_present,
            "matrix": cm.tolist(),
        },
        "error_analysis_sample": [
            {"text": t[:200], "true": tr, "predicted": pr}
            for t, tr, pr in errors
        ],
        "limitations": [
            "NYC 311 domain does not represent Indian civic complaints",
            "English-language training only",
            "Category mapping from NYC 311 is approximate",
            "Results cannot be reported as Indian system performance",
        ],
        "status": "EVALUATED",
    }

    # Per-class
    p_cls, r_cls, f_cls, supp = precision_recall_fscore_support(
        y_test, y_test_pred, labels=classes_present, zero_division=0
    )
    for i, cls in enumerate(classes_present):
        report["per_class_metrics"][cls] = {
            "precision": round(float(p_cls[i]), 4),
            "recall": round(float(r_cls[i]), 4),
            "f1": round(float(f_cls[i]), 4),
            "support": int(supp[i]),
        }

    # Save report
    report_path = Path(output_dir) / f"tfidf_baseline_{timestamp[:10]}.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nReport saved: {report_path}")

    # Save model artifacts
    model_dir = Path("ml/checkpoints/tfidf_baseline")
    model_dir.mkdir(parents=True, exist_ok=True)
    with open(model_dir / "vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    with open(model_dir / "classifier.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(model_dir / "label_binarizer.pkl", "wb") as f:
        pickle.dump(lb, f)

    metadata = {
        "model_name": "TF-IDF + One-vs-Rest Logistic Regression",
        "saved_at": timestamp,
        "vectorizer": "ml/checkpoints/tfidf_baseline/vectorizer.pkl",
        "classifier": "ml/checkpoints/tfidf_baseline/classifier.pkl",
        "label_binarizer": "ml/checkpoints/tfidf_baseline/label_binarizer.pkl",
        "categories": classes_present,
        "macro_f1": round(float(f), 4),
    }
    with open(model_dir / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Model saved: {model_dir}/")
    print("\nIMPORTANT: These results are on NYC 311 data.")
    print("Do NOT claim these numbers represent Indian municipal system performance.")

    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train TF-IDF baseline for complaint category classification")
    parser.add_argument("--data", required=True, help="Path to training data JSON or CSV")
    parser.add_argument("--output", default="ml/reports", help="Output directory for report")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    texts, labels = load_nyc311_data(args.data, NYC311_CATEGORY_MAP)
    if len(texts) < 100:
        print(f"WARNING: Only {len(texts)} usable records found. Results will not be reliable.")
    
    report = train_tfidf_baseline(texts, labels, args.output, random_seed=args.seed)
    print("\nDone.")
