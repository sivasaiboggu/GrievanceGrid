import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"

def test_login_demo_users():
    # Citizen login
    res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["role"] == "CITIZEN"

    # Officer login
    res_off = client.post("/api/auth/login", json={"email": "officer@grievancegrid.gov.in", "password": "Password123!"})
    assert res_off.status_code == 200
    assert res_off.json()["user"]["role"] == "MUNICIPAL_OFFICER"

    # Worker login
    res_w = client.post("/api/auth/login", json={"email": "worker@grievancegrid.gov.in", "password": "Password123!"})
    assert res_w.status_code == 200
    assert res_w.json()["user"]["role"] == "FIELD_WORKER"

def test_evidence_privacy_and_authorization():
    # Citizen 1 login
    c1_res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    c1_token = c1_res.json()["token"]
    c1_headers = {"Authorization": f"Bearer {c1_token}"}

    # Citizen 2 login
    c2_res = client.post("/api/auth/login", json={"email": "meera.nair@example.com", "password": "Password123!"})
    c2_token = c2_res.json()["token"]
    c2_headers = {"Authorization": f"Bearer {c2_token}"}

    # Officer login
    off_res = client.post("/api/auth/login", json={"email": "officer@grievancegrid.gov.in", "password": "Password123!"})
    off_token = off_res.json()["token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}

    # 1. Citizen 1 uploads evidence file
    fake_file = io.BytesIO(b"JPEG_MUNICIPAL_EVIDENCE_SAMPLE_BYTES_DATA")
    fake_file.name = "pothole_evidence.jpg"
    upload_res = client.post(
        "/api/evidence/upload",
        files={"file": ("pothole_evidence.jpg", fake_file, "image/jpeg")},
        headers=c1_headers
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert "sha256_hash" in upload_data
    file_url = upload_data["url"]
    filename = file_url.split("/")[-1]

    # Citizen 1 attaches evidence to a new complaint
    c_res = client.post("/api/complaints", json={
        "title": "Private Citizen Road Issue",
        "description": "Private pothole on residential street",
        "category": "Road Damage",
        "location": "Ward 14 lane 3",
        "attachments": [upload_data]
    }, headers=c1_headers)
    assert c_res.status_code == 201

    # 2. Unauthenticated request to private evidence file -> 401 Unauthorized
    unauth_res = client.get(f"/api/evidence/file/{filename}")
    assert unauth_res.status_code == 401

    # 3. Citizen 2 requests Citizen 1's private evidence -> 403 Forbidden
    forbidden_res = client.get(f"/api/evidence/file/{filename}", headers=c2_headers)
    assert forbidden_res.status_code == 403

    # 4. Citizen 1 requests their own evidence -> 200 OK
    own_res = client.get(f"/api/evidence/file/{filename}", headers=c1_headers)
    assert own_res.status_code == 200

    # 5. Officer requests evidence -> 200 OK
    officer_res = client.get(f"/api/evidence/file/{filename}", headers=off_headers)
    assert officer_res.status_code == 200

def test_complaint_and_issue_decomposition_workflow():
    # 1. Login citizen
    res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    cit_token = res.json()["token"]
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    # 2. Login officer
    res_off = client.post("/api/auth/login", json={"email": "officer@grievancegrid.gov.in", "password": "Password123!"})
    off_token = res_off.json()["token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}

    # 3. Login worker
    res_w = client.post("/api/auth/login", json={"email": "worker@grievancegrid.gov.in", "password": "Password123!"})
    w_token = res_w.json()["token"]
    w_headers = {"Authorization": f"Bearer {w_token}"}

    # 4. Citizen creates complaint with MULTI-ISSUE DECOMPOSITION
    payload = {
        "title": "Damaged asphalt surface and broken streetlight",
        "description": "Hazardous road crater near community center and streetlight pole has no light.",
        "category": "Road Damage",
        "location": "Sector 4 Civic Enclave",
        "latitude": 12.9715,
        "longitude": 77.5945,
        "jurisdiction_id": "jur-1",
        "issues": [
            {"category": "Road Damage", "description": "Hazardous road crater on sector 4 main road"},
            {"category": "Streetlight Issues", "description": "Streetlight pole non-functional and dark"}
        ]
    }
    c_res = client.post("/api/complaints", json=payload, headers=cit_headers)
    assert c_res.status_code == 201
    created = c_res.json()
    assert "tracking_id" in created
    assert created["tracking_id"].startswith("GG-")
    assert created["sub_issues_count"] == 2
    comp_id = created["id"]

    # 5. Retrieve complaint detail
    detail_res = client.get(f"/api/complaints/{comp_id}", headers=cit_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["issues"]) == 2
    assert detail["issues"][0]["category"] == "Road Damage"
    assert detail["issues"][1]["category"] == "Streetlight Issues"
    issue_1_id = detail["issues"][0]["id"]

    # 6. Officer triages complaint
    triage_res = client.put(f"/api/complaints/{comp_id}/triage", json={
        "department_id": "dept-1",
        "priority": "HIGH"
    }, headers=off_headers)
    assert triage_res.status_code == 200
    assert triage_res.json()["status"] == "TRIAGED"

    # 7. Officer creates work order linked to complaint & issue 1
    wo_res = client.post(f"/api/complaints/{comp_id}/work-orders", json={
        "issue_id": issue_1_id,
        "department_id": "dept-1",
        "assigned_to": "user-worker-1",
        "priority": "HIGH",
        "instructions": "Inspect road surface and prepare asphalt patching"
    }, headers=off_headers)
    assert wo_res.status_code == 200
    wo_id = wo_res.json()["id"]

    # 8. Field Worker attempts to resolve complaint directly -> MUST BE FORBIDDEN (403)!
    fail_resolve = client.post(f"/api/complaints/{comp_id}/resolve", json={
        "resolution_notes": "I fixed it, closing complaint"
    }, headers=w_headers)
    assert fail_resolve.status_code == 403, "Field Worker MUST NOT be able to resolve complaints!"

    # 8b. Citizen attempts to complete work order -> MUST BE FORBIDDEN (403)!
    cit_wo_fail = client.post(f"/api/work-orders/{wo_id}/complete", json={
        "remarks": "Citizen trying to complete"
    }, headers=cit_headers)
    assert cit_wo_fail.status_code == 403

    # 9. Assigned Field Worker completes assigned work order -> does NOT resolve complaint
    complete_res = client.post(f"/api/work-orders/{wo_id}/complete", json={
        "remarks": "Asphalt patched and leveled with roller"
    }, headers=w_headers)
    assert complete_res.status_code == 200

    # Verify complaint is AWAITING_VERIFICATION, NOT RESOLVED!
    c_check = client.get(f"/api/complaints/{comp_id}", headers=cit_headers).json()
    assert c_check["complaint"]["status"] == "AWAITING_VERIFICATION"

    # 10. Officer audits response coverage for the issue
    cov_res = client.post(f"/api/work-orders/{wo_id}/verify", json={
        "issue_id": issue_1_id,
        "coverage_status": "ADDRESSED",
        "notes": "Verified asphalt surface repaired satisfactorily."
    }, headers=off_headers)
    assert cov_res.status_code == 200
    assert cov_res.json()["coverage_status"] == "ADDRESSED"

    # 11. Officer formally resolves complaint
    resolve_res = client.post(f"/api/complaints/{comp_id}/resolve", json={
        "resolution_notes": "Both issues inspected and verified resolved by Municipal Officer.",
        "reasoning": "Remediation verified on site."
    }, headers=off_headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"

    # 12. Citizen provides feedback
    fb_res = client.post(f"/api/complaints/{comp_id}/feedback", json={
        "rating": 5,
        "comments": "Quick response and high quality patch work!"
    }, headers=cit_headers)
    assert fb_res.status_code == 200

    # 13. Citizen submits appeal if needed
    appeal_res = client.post(f"/api/complaints/{comp_id}/appeal", json={
        "reason": "Streetlight on pole 2 is still occasionally flickering."
    }, headers=cit_headers)
    assert appeal_res.status_code == 200
    assert appeal_res.json()["status"] == "APPEALED"
