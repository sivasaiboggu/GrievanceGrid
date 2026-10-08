# GrievanceGrid: Manual Actions & Operational Procedures

This document lists procedures that strictly require manual operator intervention (e.g., physical hardware connection, third-party credentials, institutional data approvals). All automated code, builds, migrations, and test suites are already executed and verified within the repository.

See [docs/MANUAL_ACTIONS.md](docs/MANUAL_ACTIONS.md) for full instructions and procedures.

---

## Quick Summary of Required Manual Actions:
1. **Physical Android Device Verification**: Connect device via USB debugging, execute `adb reverse`, and run `npx expo run:android` (see `docs/MANUAL_ACTIONS.md` Section 1).
2. **Institutional Dataset Approvals**: Submit data access agreements for CPGRAMS, UW-Bench, and Mapillary when external evaluation benchmarks are conducted.
3. **Optional Production Cloud Setup**: Configure AWS S3 bucket and managed RDS PostgreSQL when deploying beyond the local development environment.
