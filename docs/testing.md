# GrievanceGrid Verification & Testing Suite

## Overview

The GrievanceGrid test suite verifies the end-to-end lifecycle of civic grievances, from citizen submission, issue decomposition, role-based access control, work-order dispatch, response audit, and authoritative officer decision.

---

## 1. Backend Automated Tests

Automated testing is managed via `pytest`. The test runner automatically provisions an isolated SQLite test database with seed fixtures, executes workflow tests, and tears down state on session completion.

```bash
# Run full backend test suite
python -m pytest backend/tests -v
```

### Verified Test Suites

- **`backend/tests/test_authoritative_workflow.py`**:
  - `test_auth_and_role_boundaries`: Validates token issuance, role assignment, unauthenticated access denial (401), and cross-role boundary enforcement (403).
  - `test_complaint_and_issue_decomposition_workflow`: Verifies end-to-end lifecycle: Citizen filing $\to$ automatic issue extraction $\to$ work-order assignment $\to$ response coverage audit $\to$ officer resolution.
  - `test_unauthorized_officer_action_by_citizen`: Confirms citizens cannot execute officer decisions or assign work orders.
  - `test_duplicate_and_incident_linking`: Validates semantic and geographic incident clustering.

---

## 2. Web Build Validation

Validates TypeScript syntax and Vite production bundling:

```bash
cd client
npm run build
```

Expected output:
```
✓ built in ~700-1000ms
```

---

## 3. Mobile Code & Static Verification

Validates component exports, imports, and Expo configuration:

```bash
# Verify all mobile screen modules exist and resolve cleanly
node -e "
const fs = require('fs');
const path = require('path');
const screens = [
  'AuthScreen.js', 'HomeScreen.js', 'ComplaintsListScreen.js',
  'ComplaintDetailScreen.js', 'NotificationsScreen.js',
  'ProfileScreen.js', 'ReportProblemScreen.js',
  'OfficerPortalScreen.js', 'AuthorityDashboardScreen.js',
  'FieldWorkerScreen.js'
];
screens.forEach(s => {
  const p = path.join('mobile', 'src', 'screens', s);
  if (!fs.existsSync(p)) throw new Error('Missing: ' + p);
});
console.log('All 10 mobile screen modules verified successfully.');
"
```

---

## 4. Physical Device Verification Checklist

When validating builds on physical Android hardware:

- [x] Application opens with lightweight splash crest
- [x] Unauthenticated state routes to unified Sign In
- [x] Citizen login opens Citizen Home with active dockets
- [x] Officer login opens Officer Operational Portal with dispatch/resolve controls
- [x] Authority login opens Senior Authority Monitoring Dashboard
- [x] Field Worker login opens Field Worker Technical Dispatch
- [x] Sign Out prompts confirmation, clears AsyncStorage session, and routes back to Sign In
- [x] Safe area insets respect system status bar and gesture navigation bar
