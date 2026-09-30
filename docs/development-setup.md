# GrievanceGrid Local Development & Setup Guide

## Prerequisites

Ensure you have the following installed on your host machine:

- **Git** (2.30+)
- **Python** (3.11 or 3.12)
- **Node.js** (18.x or 20.x LTS) & **npm**
- **Docker & Docker Compose** (for PostgreSQL + PostGIS + pgvector and Redis)
- **Android Studio / Android SDK** (for local Android build, including command-line tools and platform SDK 34+)

---

## 1. Database Setup (Docker)

Start the authoritative PostgreSQL container with PostGIS 3.4 and pgvector extensions:

```bash
# Build and run PostgreSQL + PostGIS + pgvector and Redis in background
docker compose up -d db redis

# Verify container health
docker compose ps
```

The database initializes automatically on `localhost:5432` with user `grievancegrid` and database `grievancegrid`.

---

## 2. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations and seed default municipal data
python -c "from app.database import Base, engine, SessionLocal; from app.seed import seed_data_if_empty; Base.metadata.create_all(bind=engine); db=SessionLocal(); seed_data_if_empty(db); db.close()"

# Start FastAPI development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Health Check**: `http://localhost:8000/health`
- **Interactive OpenAPI Documentation**: `http://localhost:8000/docs`

---

## 3. Web Client Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 4. Mobile Setup & Physical Android Device Testing

### Environment Configuration
When testing on a physical Android phone, configure `EXPO_PUBLIC_API_URL` with your computer's local Wi-Fi IP address:

```powershell
# In PowerShell (Windows)
$env:EXPO_PUBLIC_API_URL="http://<YOUR_LOCAL_IP>:8000/api"

# In Bash / macOS
export EXPO_PUBLIC_API_URL="http://<YOUR_LOCAL_IP>:8000/api"
```

### Option A: Local Native Android Build & ADB Install
```bash
cd mobile

# Install dependencies
npm install

# Generate Android project (if not present)
npx expo prebuild --platform android --no-install

# Compile debug APK
cd android
./gradlew assembleDebug --no-daemon

# Connect phone via USB with USB Debugging enabled, then install
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Forward ports over ADB for reliable connectivity
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8082 tcp:8082

# Start development Metro bundler
cd ..
npx expo start --dev-client --lan --port 8082
```

---

## 5. Development Test Accounts

Default demonstration accounts populated in the local database:

| Role | Email | Password | Intended Experience |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@grievancegrid.gov.in` | `Password123!` | Citizen Home & Grievance Filing |
| **Municipal Officer** | `officer@grievancegrid.gov.in` | `Password123!` | Officer Operational Review Portal |
| **Senior Authority** | `authority@grievancegrid.gov.in` | `Password123!` | Senior Authority Monitoring Dashboard |
| **Field Worker** | `worker@grievancegrid.gov.in` | `Password123!` | Field Worker Technical Dispatch |
