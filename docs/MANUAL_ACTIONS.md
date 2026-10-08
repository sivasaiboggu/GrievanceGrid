# GrievanceGrid: Manual Actions & Operational Procedures

This document lists procedures that strictly require manual operator intervention (e.g., physical hardware connection, third-party credentials, institutional data approvals). All automated code, builds, migrations, and test suites are already executed and verified within the repository.

---

## 1. Physical Android Hardware Verification

*Status:* **MANUAL ACTION REQUIRED** (`adb devices` currently reports 0 connected physical devices).

When a physical Android smartphone is available, follow these steps to perform on-device verification:

### Prerequisites:
1. Android smartphone running Android 10+ (API level 29+).
2. Developer Options enabled on device with **USB Debugging** active.
3. USB data cable connecting smartphone to the host workstation.

### Step-by-Step Procedure:
1. **Verify ADB Connection**:
   ```bash
   adb devices
   ```
   Ensure your device is listed with state `device` (not `unauthorized` or `offline`).

2. **Configure Reverse Port Forwarding**:
   Reverse local ports so the smartphone accesses local development backend and Expo packager:
   ```bash
   adb reverse tcp:8000 tcp:8000
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:8082 tcp:8082
   ```

3. **Install Debug APK or Launch via Expo**:
   ```bash
   cd mobile
   npx expo run:android
   ```
   *Alternative native build command:*
   ```bash
   cd mobile/android
   ./gradlew assembleDebug --no-daemon
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

4. **On-Device Smoke Test Checklist**:
   - [ ] Launch application and verify splash crest.
   - [ ] Sign in as Citizen (`citizen@grievancegrid.gov.in` / `Password123!`).
   - [ ] Test Report Problem wizard: grant Camera & Location permissions.
   - [ ] Capture live photograph and submit grievance; verify tracking ID generation.
   - [ ] Sign out; sign in as Municipal Officer (`officer@grievancegrid.gov.in`).
   - [ ] Verify Officer Overview KPI counters, complaints queue, and work order dispatch.
   - [ ] Sign out; sign in as Field Worker (`worker@grievancegrid.gov.in`).
   - [ ] Verify assigned work order list, start job (`IN_PROGRESS`), and submit completion report (`SUBMITTED FOR VERIFICATION`).
   - [ ] Press Android hardware Back button: verify screen transitions back without exiting until at Home screen.
   - [ ] Kill and reopen app: verify session is restored via AsyncStorage.

---

## 2. Institutional Dataset Access Requests

All external benchmark datasets in `datasets/manifests/dataset_manifest.csv` are marked `ACCESS_REQUIRED` to maintain research truthfulness. No datasets have been fabricated.

### 2.1 CPGRAMS Public Grievance Data
- **Portal**: https://pgportal.gov.in / https://data.gov.in
- **Access Type**: Restricted Government Dataset
- **Action Required**:
  1. Register an institutional research account at data.gov.in.
  2. Submit formal academic research request to the Ministry of Personnel, Public Grievances & Pensions.
  3. Upon approval, store issued credentials in `.env`:
     ```bash
     CPGRAMS_API_KEY=<issued_key>
     CPGRAMS_API_SECRET=<issued_secret>
     ```
  4. See `datasets/raw/cpgrams/ACCESS_REQUIRED.md` for full schema details.

### 2.2 UW-Bench (Urban Waterlogging Benchmark)
- **Portal**: https://github.com/citybenchmarks/uw-bench
- **Access Type**: Academic Dataset Agreement Required
- **Action Required**:
  1. Complete author request form and execute data use agreement.
  2. Download archive and place in `datasets/raw/uw_bench/`.

### 2.3 Mapillary Street-Level Imagery
- **Portal**: https://www.mapillary.com/dataset
- **Access Type**: Non-commercial developer registration
- **Action Required**:
  1. Create Mapillary developer account and generate API access token.
  2. Download urban road defect reference subset to `datasets/raw/mapillary/`.

---

## 3. Production Cloud Infrastructure Setup (Optional)

For local evaluation, GrievanceGrid operates out-of-the-box using the SQLite local vault fallback or local Docker PostgreSQL stack. For cloud deployments:

1. **Managed PostgreSQL with PostGIS & pgvector**:
   - Provision a PostgreSQL 16+ instance (e.g. AWS RDS / Supabase).
   - Enable extensions:
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
   - Update `DATABASE_URL` in `.env`.

2. **S3-Compatible Evidence Storage**:
   - Provision AWS S3 / MinIO private bucket.
   - Configure bucket CORS and bucket policies for private access.
   - Set `S3_ENDPOINT_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, and `S3_BUCKET_NAME` in `.env`.

---

## 4. Final Live Demonstration Checklist

Before commencing a live project presentation or examination:
1. Start backend service:
   ```bash
   cd backend
   uv run python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
2. Start web client:
   ```bash
   cd client
   npm run dev
   ```
3. Use Quick Access role presets on `http://localhost:5173` to demonstrate:
   - **Citizen**: 4-step intake wizard, decomposed issues, and tracking timeline.
   - **Officer**: Overview stats, queue triage, issue confirmation, incident grouping, and resolution decision with response coverage (`ADDRESSED`).
   - **Field Worker Web Guidance**: Demonstrates enforced portal separation directing field staff to mobile app.
   - **Senior Authority**: Governance metrics and precinct dockets oversight.
