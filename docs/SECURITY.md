# GrievanceGrid: Security Architecture & Hardening Specifications

This document outlines the security controls, authentication mechanisms, authorization boundaries, and upload hardening applied across GrievanceGrid.

---

## 1. Authentication & Session Management

- **Password Storage**: Cryptographic password hashing using `bcrypt` (work factor 12) via `passlib`.
- **Token Format**: Signed JSON Web Tokens (JWT) encoded using HMAC-SHA256 (`HS256`).
- **Token Lifetime**: Configured via `ACCESS_TOKEN_EXPIRE_MINUTES`.
- **Role Assignment**: Strictly server-side. Users cannot specify their role during authentication.
- **Session Termination**: Logout immediately clears JWT tokens from browser `localStorage` and mobile `AsyncStorage`.

---

## 2. Server-Side Role-Based Access Control (RBAC)

Endpoints are protected with `require_role(...)` FastAPI dependencies enforcing strict least-privilege principles:
- **CITIZEN**: Restricted to personal complaints, owned evidence, and lodging appeals.
- **MUNICIPAL_OFFICER**: Authorized for queue triage, issue confirmation, incident grouping, work order dispatch, response verification, and resolution sign-off.
- **FIELD_WORKER**: Restricted to assigned work orders; cannot access cross-department data or execute complaint resolution.
- **SENIOR_AUTHORITY**: High-level read-only governance oversight, SLA analytics, and appeal adjudication.

---

## 3. Evidence Vault & Upload Security

- **File Size Ceiling**: Strictly capped at 10 MB per attachment.
- **MIME Whitelist**: Restricted to `image/jpeg`, `image/png`, `image/webp`, `image/heic`, and `application/pdf`.
- **Storage Sanitization**: Files are saved under randomly generated UUID names (`ev_{uuid}_{hash}.ext`) preventing arbitrary path traversal attacks (`os.path.basename` enforcement). Client-supplied filenames are never used for local storage paths.
- **Integrity Digest**: Cryptographic SHA-256 hash is computed on upload and stored in the database.
- **Private Evidence Serving**: `/api/v1/evidence/file/{filename}` validates user permissions before serving private evidence, rejecting cross-citizen access with HTTP 403.

---

## 4. Configuration & Secrets Protection

- **No Secrets in Source Control**: All credentials, JWT secrets, and database passwords are configured via `.env` files.
- **`.env.example` Template**: Safe placeholder file committed to repository. Real `.env` is ignored by `.gitignore`.
- **Cross-Origin Resource Sharing (CORS)**: Configured in `app/main.py`.
