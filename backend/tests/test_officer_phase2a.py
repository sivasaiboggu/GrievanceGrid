import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_officer_overview_metrics_and_authorization():
    # Citizen login
    cit_res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    cit_token = cit_res.json()["token"]
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    # Officer login
    off_res = client.post("/api/auth/login", json={"email": "officer@grievancegrid.gov.in", "password": "Password123!"})
    off_token = off_res.json()["token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}

    # 1. Citizen cannot access Officer Overview (403 Forbidden)
    forbidden_res = client.get("/api/complaints/officer/overview", headers=cit_headers)
    assert forbidden_res.status_code == 403

    # 2. Officer can access Officer Overview (200 OK)
    overview_res = client.get("/api/complaints/officer/overview", headers=off_headers)
    assert overview_res.status_code == 200
    data = overview_res.json()
    assert "stats" in data
    assert "needs_triage" in data["stats"]
    assert "in_progress" in data["stats"]
    assert "awaiting_verification" in data["stats"]
    assert "appeals" in data["stats"]
    assert "total_active" in data["stats"]
    assert "needs_attention" in data
    assert "recent_dockets" in data

def test_officer_issue_review_and_confirmation():
    cit_res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    cit_headers = {"Authorization": f"Bearer {cit_res.json()['token']}"}

    off_res = client.post("/api/auth/login", json={"email": "officer@grievancegrid.gov.in", "password": "Password123!"})
    off_headers = {"Authorization": f"Bearer {off_res.json()['token']}"}

    # Citizen submits complaint with decomposed issues
    comp_res = client.post("/api/complaints", json={
        "title": "Luminaire flicker and curb waste",
        "description": "Streetlight luminaire flickering and garbage piled beside post.",
        "category": "Streetlight Issues",
        "location": "Clover St & 14th Ave",
        "issues": [
            {"category": "Streetlight Issues", "description": "Streetlight luminaire flickering"},
            {"category": "Garbage & Waste", "description": "Garbage piled beside post"}
        ]
    }, headers=cit_headers)
    assert comp_res.status_code == 201
    comp_id = comp_res.json()["id"]

    # Get detail
    detail = client.get(f"/api/complaints/{comp_id}", headers=off_headers).json()
    issue_1 = detail["issues"][0]
    assert issue_1["status"] == "SUBMITTED"

    # Officer confirms issue classification
    confirm_res = client.put(f"/api/complaints/{comp_id}/issues/{issue_1['id']}/confirm", json={
        "category": "Streetlight Issues",
        "department_id": "dept-4",
        "notes": "Verified against precinct electrical grid"
    }, headers=off_headers)
    assert confirm_res.status_code == 200
    assert confirm_res.json()["issue"]["status"] == "OFFICER_CONFIRMED"

def test_incident_linking_and_separation():
    cit_res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    cit_headers = {"Authorization": f"Bearer {cit_res.json()['token']}"}

    off_res = client.post("/api/auth/login", json={"email": "officer@grievancegrid.gov.in", "password": "Password123!"})
    off_headers = {"Authorization": f"Bearer {off_res.json()['token']}"}

    # Complaint A
    c_a = client.post("/api/complaints", json={
        "title": "Flooding on Sector 4 crossroad",
        "description": "Storm drain backing up water",
        "category": "Drainage & Sewage",
        "location": "Sector 4 crossroad",
    }, headers=cit_headers).json()

    # Complaint B
    c_b = client.post("/api/complaints", json={
        "title": "Standing water near bus stop",
        "description": "Catch basin blocked by gravel",
        "category": "Drainage & Sewage",
        "location": "Sector 4 bus stop",
    }, headers=cit_headers).json()

    # Fetch candidates for Complaint A
    candidates_res = client.get(f"/api/complaints/{c_a['id']}/related-candidates", headers=off_headers)
    assert candidates_res.status_code == 200
    candidates = candidates_res.json()
    assert len(candidates) > 0

    # Officer confirms incident relationship
    confirm_res = client.post(f"/api/complaints/{c_a['id']}/confirm-incident", json={
        "related_complaint_id": c_b["id"],
        "incident_title": "Sector 4 Drainage Sub-basin Obstruction"
    }, headers=off_headers)
    assert confirm_res.status_code == 200
    incident_id = confirm_res.json()["incident_id"]
    assert incident_id is not None

    # Verify both complaints now share the incident ID and are NOT merged or deleted
    detail_a = client.get(f"/api/complaints/{c_a['id']}", headers=off_headers).json()
    detail_b = client.get(f"/api/complaints/{c_b['id']}", headers=off_headers).json()
    assert detail_a["complaint"]["incident_id"] == incident_id
    assert detail_b["complaint"]["incident_id"] == incident_id
    assert detail_a["complaint"]["id"] != detail_b["complaint"]["id"]

    # Officer tests keep separate on another record
    separate_res = client.post(f"/api/complaints/{c_a['id']}/separate-incident", json={
        "related_complaint_id": "comp-1",
        "reason": "Different drainage catchment basin"
    }, headers=off_headers)
    assert separate_res.status_code == 200

def test_officer_decision_and_appeal_adjudication():
    cit_res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    cit_headers = {"Authorization": f"Bearer {cit_res.json()['token']}"}

    off_res = client.post("/api/auth/login", json={"email": "officer@grievancegrid.gov.in", "password": "Password123!"})
    off_headers = {"Authorization": f"Bearer {off_res.json()['token']}"}

    w_res = client.post("/api/auth/login", json={"email": "worker@grievancegrid.gov.in", "password": "Password123!"})
    w_headers = {"Authorization": f"Bearer {w_res.json()['token']}"}

    comp = client.post("/api/complaints", json={
        "title": "Broken pavement and dangerous pit",
        "description": "Sidewalk concrete fractured",
        "category": "Road Damage",
        "location": "Main promenade",
    }, headers=cit_headers).json()
    comp_id = comp["id"]

    # Field worker cannot submit officer decision (403 Forbidden)
    forbidden_dec = client.post(f"/api/complaints/{comp_id}/decision", json={
        "action": "RESOLVE",
        "reasoning": "Worker attempting to resolve"
    }, headers=w_headers)
    assert forbidden_dec.status_code == 403

    # Officer executes formal resolution decision
    dec_res = client.post(f"/api/complaints/{comp_id}/decision", json={
        "action": "RESOLVE",
        "reasoning": "Concrete pavement reconstructed and inspected.",
        "coverage_status": "ADDRESSED"
    }, headers=off_headers)
    assert dec_res.status_code == 200
    assert dec_res.json()["status"] == "RESOLVED"

    # Citizen submits appeal
    appeal_res = client.post(f"/api/complaints/{comp_id}/appeal", json={
        "reason": "Edge of pavement remains loose and crumbling underfoot."
    }, headers=cit_headers)
    assert appeal_res.status_code == 200

    detail = client.get(f"/api/complaints/{comp_id}", headers=off_headers).json()
    appeal_id = detail["appeals"][0]["id"]

    # Officer adjudicates appeal: REOPEN
    reopen_res = client.post(f"/api/complaints/{comp_id}/appeals/{appeal_id}/adjudicate", json={
        "decision": "REOPEN",
        "notes": "Secondary field dispatch authorized to smooth pavement edges."
    }, headers=off_headers)
    assert reopen_res.status_code == 200
    assert reopen_res.json()["appeal_status"] == "REOPENED"
    assert reopen_res.json()["complaint_status"] == "IN_PROGRESS"


def test_field_worker_unauthorized_complaint_access():
    cit_res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    cit_headers = {"Authorization": f"Bearer {cit_res.json()['token']}"}

    w_res = client.post("/api/auth/login", json={"email": "worker@grievancegrid.gov.in", "password": "Password123!"})
    w_headers = {"Authorization": f"Bearer {w_res.json()['token']}"}

    # Citizen submits complaint
    comp = client.post("/api/complaints", json={
        "title": "Private electrical substation leak",
        "description": "Oil residue beneath municipal power unit",
        "category": "Electrical & Energy",
        "location": "Substation 12B",
    }, headers=cit_headers).json()
    comp_id = comp["id"]

    # Field worker has NOT been assigned a work order for this complaint -> 403 Forbidden
    worker_access = client.get(f"/api/complaints/{comp_id}", headers=w_headers)
    assert worker_access.status_code == 403
    assert "not assigned" in worker_access.json()["detail"].lower()


def test_work_order_hardening_and_duplicate_prevention():
    cit_res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    cit_headers = {"Authorization": f"Bearer {cit_res.json()['token']}"}

    off_res = client.post("/api/auth/login", json={"email": "officer@grievancegrid.gov.in", "password": "Password123!"})
    off_headers = {"Authorization": f"Bearer {off_res.json()['token']}"}

    # Citizen submits complaint with an issue
    comp = client.post("/api/complaints", json={
        "title": "Broken storm grate",
        "description": "Iron storm grate missing two bars",
        "category": "Drainage & Sewage",
        "location": "Avenue 9 Cross",
        "issues": [
            {"category": "Drainage & Sewage", "description": "Iron storm grate missing two bars"}
        ]
    }, headers=cit_headers).json()
    comp_id = comp["id"]

    detail = client.get(f"/api/complaints/{comp_id}", headers=off_headers).json()
    issue_id = detail["issues"][0]["id"]

    # 1. Invalid worker ID rejected (400)
    inv_worker = client.post("/api/work-orders", json={
        "complaint_id": comp_id,
        "issue_id": issue_id,
        "department_id": "dept-4",
        "assigned_worker_id": "nonexistent-worker-id",
        "priority": "HIGH"
    }, headers=off_headers)
    assert inv_worker.status_code == 400

    # 2. Valid work order creation succeeds
    valid_wo = client.post("/api/work-orders", json={
        "complaint_id": comp_id,
        "issue_id": issue_id,
        "department_id": "dept-4",
        "assigned_worker_id": "user-worker-1",
        "priority": "HIGH"
    }, headers=off_headers)
    assert valid_wo.status_code == 200

    # 3. Duplicate active work order on the same issue rejected (409 Conflict)
    dup_wo = client.post("/api/work-orders", json={
        "complaint_id": comp_id,
        "issue_id": issue_id,
        "department_id": "dept-4",
        "assigned_worker_id": "user-worker-1",
        "priority": "MEDIUM"
    }, headers=off_headers)
    assert dup_wo.status_code == 409
    assert "active work order" in dup_wo.json()["detail"].lower()


def test_response_coverage_hardening_and_overdue_rejection():
    cit_res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    cit_headers = {"Authorization": f"Bearer {cit_res.json()['token']}"}

    off_res = client.post("/api/auth/login", json={"email": "officer@grievancegrid.gov.in", "password": "Password123!"})
    off_headers = {"Authorization": f"Bearer {off_res.json()['token']}"}

    comp = client.post("/api/complaints", json={
        "title": "Damaged guard rail near river",
        "description": "Metal barrier bent outward",
        "category": "Road Damage",
        "location": "Riverside Drive 42",
        "issues": [
            {"category": "Road Damage", "description": "Metal barrier bent outward"}
        ]
    }, headers=cit_headers).json()
    comp_id = comp["id"]
    detail = client.get(f"/api/complaints/{comp_id}", headers=off_headers).json()
    issue_id = detail["issues"][0]["id"]

    # 1. OVERDUE rejected as response coverage (400 Bad Request)
    overdue_cov = client.post(f"/api/complaints/{comp_id}/decision", json={
        "action": "RESOLVE",
        "reasoning": "Attempting invalid coverage value",
        "coverage_status": "OVERDUE",
        "issue_id": issue_id
    }, headers=off_headers)
    assert overdue_cov.status_code == 400
    assert "workflow condition" in overdue_cov.json()["detail"].lower()

    # 2. Valid response coverage (PARTIAL) succeeds and records issue-level coverage
    valid_cov = client.post(f"/api/complaints/{comp_id}/decision", json={
        "action": "RESOLVE",
        "reasoning": "Temporary stabilization barrier placed; final welding scheduled.",
        "coverage_status": "PARTIAL",
        "issue_id": issue_id
    }, headers=off_headers)
    assert valid_cov.status_code == 200
    assert valid_cov.json()["status"] == "RESOLVED"


def test_appeal_rejection_lifecycle():
    cit_res = client.post("/api/auth/login", json={"email": "citizen@grievancegrid.gov.in", "password": "Password123!"})
    cit_headers = {"Authorization": f"Bearer {cit_res.json()['token']}"}

    off_res = client.post("/api/auth/login", json={"email": "officer@grievancegrid.gov.in", "password": "Password123!"})
    off_headers = {"Authorization": f"Bearer {off_res.json()['token']}"}

    comp = client.post("/api/complaints", json={
        "title": "Park bench broken slat",
        "description": "Slat unbolted from bench frame",
        "category": "Parks & Recreation",
        "location": "Sector 3 Central Park",
    }, headers=cit_headers).json()
    comp_id = comp["id"]

    # 1. Citizen cannot appeal complaint that is NOT RESOLVED (400)
    unresolved_appeal = client.post(f"/api/complaints/{comp_id}/appeal", json={
        "reason": "Premature appeal"
    }, headers=cit_headers)
    assert unresolved_appeal.status_code == 400
    assert "only resolved complaints can be appealed" in unresolved_appeal.json()["detail"].lower()

    # 2. Officer resolves complaint
    client.post(f"/api/complaints/{comp_id}/decision", json={
        "action": "RESOLVE",
        "reasoning": "Bench slats replaced and bolted securely.",
        "coverage_status": "ADDRESSED"
    }, headers=off_headers)

    # 3. Citizen submits appeal
    appeal_res = client.post(f"/api/complaints/{comp_id}/appeal", json={
        "reason": "Coating on the wood is rough and peeling."
    }, headers=cit_headers)
    assert appeal_res.status_code == 200
    detail = client.get(f"/api/complaints/{comp_id}", headers=off_headers).json()
    appeal_id = detail["appeals"][0]["id"]

    # 4. Officer rejects appeal -> complaint returns to RESOLVED with status history
    reject_res = client.post(f"/api/complaints/{comp_id}/appeals/{appeal_id}/adjudicate", json={
        "decision": "REJECT",
        "notes": "Weatherproofing sealant applied meets municipal specification."
    }, headers=off_headers)
    assert reject_res.status_code == 200
    assert reject_res.json()["appeal_status"] == "REJECTED"
    assert reject_res.json()["complaint_status"] == "RESOLVED"

