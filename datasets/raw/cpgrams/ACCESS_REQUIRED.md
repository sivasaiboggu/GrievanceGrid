# CPGRAMS Dataset Access Required

## Why Access is Required

CPGRAMS (Centralized Public Grievance Redress and Monitoring System) is operated by the
Ministry of Personnel, Public Grievances & Pensions, Government of India.

Public grievance data is classified government data and is NOT freely downloadable.
The system is accessible at: https://pgportal.gov.in

## Access Method

Official data access may be available via:
- data.gov.in (India Open Government Data Portal)
- Official CPGRAMS API (requires registration and approval)
- Ministry of Personnel formal data request

## Required Credentials

```
CPGRAMS_API_KEY=<your_api_key>
CPGRAMS_API_SECRET=<your_api_secret>
CPGRAMS_BASE_URL=<provided_upon_approval>
```

These must be placed in `.env` and NEVER committed to source control.

## Expected Schema

Based on public documentation, CPGRAMS records typically contain:
- Grievance ID
- Grievance Category
- Grievance Text / Description
- Date of Filing
- Ministry/Department
- Current Status
- Disposal Date (if resolved)
- Feedback Rating (if provided)

## Download Command (when credentials available)

```bash
python scripts/datasets/download_cpgrams.py \
  --api-key $CPGRAMS_API_KEY \
  --output datasets/raw/cpgrams/ \
  --start-date 2022-01-01 \
  --end-date 2024-12-31
```

## Current Status

**ACCESS_REQUIRED** — No credentials currently available.

The system will function using NYC 311 and other available datasets.
Do NOT fabricate CPGRAMS records.

## Important Notes

- Do NOT bypass API restrictions or scrape restricted endpoints
- Do NOT invent CPGRAMS-style complaint records
- Do NOT claim CPGRAMS integration without actual access
- This is documented as "research access pending"
