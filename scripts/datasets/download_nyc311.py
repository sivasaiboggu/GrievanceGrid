#!/usr/bin/env python3
"""
NYC 311 Service Requests Dataset Download Script
=================================================
Downloads the NYC 311 Service Requests dataset from NYC Open Data.

Official source: https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9

Usage:
    python scripts/datasets/download_nyc311.py --rows 500000 --start-date 2020-01-01 --end-date 2024-12-31

Requirements:
    pip install requests tqdm
"""

import os
import sys
import json
import hashlib
import argparse
from pathlib import Path
from datetime import datetime

OUTPUT_DIR = Path("datasets/raw/nyc311")
METADATA_DIR = Path("datasets/metadata")

# Socrata Open Data API endpoint
DATASET_ID = "erm2-nwe9"
BASE_URL = f"https://data.cityofnewyork.us/resource/{DATASET_ID}.json"

# Categories relevant to civic grievance research
RELEVANT_COMPLAINT_TYPES = [
    "Pothole",
    "Street Light Condition",
    "Sidewalk Condition",
    "Noise - Street/Sidewalk",
    "Dirty Condition",
    "Blocked Driveway",
    "HEAT/HOT WATER",
    "Water System",
    "Sewer",
    "Street Flooding",
    "Building/Use",
    "Homeless Encampment",
    "Traffic Signal Condition",
    "Broken Muni Meter",
    "Derelict Vehicle",
    "Illegal Parking",
]


def compute_file_sha256(filepath: Path) -> str:
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def download_nyc311(rows: int = 100000, start_date: str = "2020-01-01", end_date: str = "2024-12-31"):
    """Download NYC 311 data from Socrata API."""
    try:
        import requests
        from urllib.parse import urlencode
    except ImportError:
        print("ERROR: requests package not installed. Run: pip install requests")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Downloading NYC 311 dataset ({rows} rows, {start_date} to {end_date})...")
    print(f"Source: {BASE_URL}")

    output_file = OUTPUT_DIR / f"nyc311_{start_date[:4]}_{end_date[:4]}.json"

    params = {
        "$limit": rows,
        "$where": f"created_date >= '{start_date}' AND created_date <= '{end_date}'",
        "$order": "created_date DESC",
        "$select": (
            "unique_key,created_date,closed_date,agency,agency_name,"
            "complaint_type,descriptor,location_type,incident_zip,"
            "incident_address,street_name,cross_street_1,cross_street_2,"
            "intersection_street_1,intersection_street_2,address_type,"
            "city,landmark,facility_type,status,due_date,resolution_description,"
            "resolution_action_updated_date,community_board,bbl,borough,"
            "x_coordinate_state_plane,y_coordinate_state_plane,open_data_channel_type,"
            "park_facility_name,latitude,longitude,location"
        ),
    }

    url = f"{BASE_URL}?{urlencode(params)}"

    print(f"Request URL: {url[:200]}...")

    resp = requests.get(url, timeout=120)
    resp.raise_for_status()

    data = resp.json()
    print(f"Downloaded {len(data)} records.")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    checksum = compute_file_sha256(output_file)

    metadata = {
        "dataset_id": "nyc311",
        "dataset_name": "NYC 311 Service Requests (2020-Present)",
        "download_timestamp": datetime.utcnow().isoformat(),
        "source_url": BASE_URL,
        "official_source": "NYC Open Data Portal (data.cityofnewyork.us)",
        "license": "Public Domain (City of New York)",
        "version": f"{start_date}_{end_date}",
        "rows_downloaded": len(data),
        "rows_requested": rows,
        "date_range": {"start": start_date, "end": end_date},
        "output_file": str(output_file),
        "sha256_checksum": checksum,
        "domain_limitations": [
            "US city (New York) domain only",
            "Does NOT represent Indian municipal complaints",
            "Language is English only",
            "Geographic patterns differ significantly from Indian cities",
            "Complaint categories may not directly map to Indian municipal categories",
            "Use for complaint text structure learning and category classification baseline only",
        ],
        "research_use": [
            "Complaint category classification training (with domain adaptation caveats)",
            "Complaint text analysis and structure learning",
            "Temporal and spatial analysis methodology",
            "Related complaint retrieval baseline",
            "TF-IDF + Logistic Regression baseline training",
        ],
    }

    meta_file = METADATA_DIR / "nyc311_metadata.json"
    with open(meta_file, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nDownload complete.")
    print(f"Output: {output_file}")
    print(f"Records: {len(data)}")
    print(f"SHA-256: {checksum}")
    print(f"Metadata: {meta_file}")
    print(f"\nIMPORTANT: This is US city data. Do NOT claim it represents Indian municipal complaints.")
    print("Use for category learning with domain adaptation caveats documented.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download NYC 311 Service Requests dataset")
    parser.add_argument("--rows", type=int, default=100000, help="Number of rows to download (default: 100000)")
    parser.add_argument("--start-date", default="2020-01-01", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end-date", default="2024-12-31", help="End date (YYYY-MM-DD)")
    args = parser.parse_args()

    download_nyc311(rows=args.rows, start_date=args.start_date, end_date=args.end_date)
