# plan.md — IT Inventory Management System

## 1. Objectives
- Deliver a production-ready IT Inventory Management System (FastAPI + MongoDB + React/shadcn/Tailwind) with enterprise UX.
- Ensure **traceable, atomic stock control** via movements (entries/exits/adjustments) with **no negative stock**.
- Provide **fast scan-first flows** (QR/barcode generate + html5-qrcode scanning) for entry/exit/view.
- Implement **RBAC** (Admin/Manager/Viewer + configurable permissions), **JWT auth**, and **immutable audit logging**.
- Enable operational tooling: alerts, reports, import/export (Excel/CSV/PDF), physical inventory counts, label printing, demo seed.

## 2. Implementation Steps

### Phase 1 — Core Workflow POC (Isolation)
> Core = movement + atomic stock update + scan lookup. Do not proceed until stable.

**Scope (MVP POC):**
- Minimal backend models: Product (sku, name, stock, codes), Movement (type, qty, user, reason), AuditLog.
- Endpoints: create product, get by code/SKU, post entry, post exit (block if insufficient), list movements.
- Atomic update: MongoDB `find_one_and_update` with conditional filter (e.g., `stock >= qty`) + `$inc`, write movement in same request; verify failure modes.
- QR/barcode: generate base64 PNG endpoints for a product.

**Web search (best practices):**
- Confirm MongoDB atomic decrement patterns and transaction guidance with Motor/FastAPI.
- Confirm html5-qrcode integration patterns for React SPA.

**POC validation script/tests:**
- Add a standalone Python script to:
  - create product with stock
  - run concurrent exits to attempt oversell
  - assert stock never goes negative and correct errors are returned
  - verify movement records count and integrity

**Phase 1 user stories (POC UX):**
1. As a manager, I can create a product with an initial stock so I can begin tracking it.
2. As a manager, I can register an entry and see stock increase immediately.
3. As a manager, I can register an exit and the system blocks exits larger than available stock.
4. As a user, I can look up a product by SKU/QR/barcode value so scanning can be fast.
5. As an admin, I can see a movement log proving every stock change is traceable.

---

### Phase 2 — V1 App Development (Full stack MVP, minimal bulk edits) — **COMPLETED**

**Status:** ✅ 100% — Backend 56/56 tests passed, Frontend 30/30 scenarios passed, README.md delivered.


> Build full app around proven core. Keep implementation direct but complete.

**Backend (FastAPI + Motor):**
- Auth: JWT (email/password), bcrypt hashing, refresh/access tokens (or access-only with short TTL), protected routes.
- Seed: default admin `admin@company.com / Admin123!` + demo dataset.
- RBAC: roles (Admin/Manager/Viewer) + permissions table/collection; middleware dependency checks per route.
- Data models/collections:
  - users, roles, permissions
  - products, categories, brands, suppliers, locations
  - inventory_movements (entry/exit/adjustment), stock_counts (+ items)
  - audit_logs, alerts
- Key endpoints:
  - CRUD: products/categories/brands/suppliers/locations/users
  - Movements: entry/exit/adjustment; movement history filters + search
  - Scan lookup: by barcode/qr/sku
  - QR/barcode generation + label payload
  - Dashboard aggregates + alerts
  - Import/export: template download, upload validate/preview/commit, exports with filters
  - Reports: inventory, low/out, movement summaries, user activity
- Rules/validation:
  - Unique constraints: sku, barcode, qr_code (app-level + indexes)
  - No negative stock (backend hard block)
  - No manual stock edits outside movements
  - Friendly error responses; log technical details server-side
- Performance: pagination, text indexes, compound indexes for common filters.

**Frontend (React + shadcn/ui + Tailwind):**
- Layout: sidebar + topbar + breadcrumbs; responsive with mobile-first scanner.
- Auth pages: login; admin user management for creating users.
- Core pages:
  - Dashboard (cards + charts via recharts)
  - Products: list (filters/search), create/edit, detail page (codes + history)
  - Movements: create entry/exit/adjustment, movement history table
  - Scanner: html5-qrcode → product result → quick entry/exit/view
  - Master data: categories/brands/suppliers/locations
  - Alerts: low/out/missing codes/no-movement
  - Reports + export
  - Import: template, upload, preview errors, commit
  - Audit log viewer (admin-only)
  - Physical count sessions (create session, scan items, discrepancy, generate adjustments)
- UX standards: toasts, confirmations, empty states, skeletons, inline validation.

**Demo seed (clearly marked):**
- ~30 products across realistic IT categories, multiple locations/suppliers.
- Pre-generated QR/barcode values, sample movements, sample alerts.

**Phase 2 user stories (V1):**
1. As an admin, I can log in with the seeded admin account and access all modules.
2. As an admin, I can create categories/brands/suppliers/locations used in products.
3. As a manager, I can scan a QR/barcode on my phone and register an entry/exit in seconds.
4. As a manager, I can browse/filter movement history by date/type/product/user and search text.
5. As a viewer, I can view products and product history but cannot perform write actions.

**End of Phase 2:** run 1 full E2E pass with `testing_agent_v3`, fix blocking issues.

---

### Phase 3 — Production Hardening + Feature Completion
- Permissions configurator UI (toggle permissions per role; enforce backend).
- Reporting upgrades: PDF layouts, scheduled-style report presets (saved filters).
- Label printing: printable label sheet layouts (Avery-like) with QR/barcode + location.
- Physical counts: better workflows (resume session, lock session, export discrepancy report).
- Alert tuning: thresholds, no-movement window, alert dismissal/ack.
- Audit log: immutable constraints (no delete), richer diff details.
- Security polish: token rotation (if used), rate limiting for auth, stronger password policy.
- Data integrity: dedupe tools, import idempotency, safer merges.

**Phase 3 user stories:**
1. As an admin, I can configure role permissions without code changes.
2. As an admin, I can export a filtered report to PDF that matches what I see on screen.
3. As an admin, I can print label sheets for a batch of products.
4. As an admin, I can run a physical count for a location and generate adjustments from discrepancies.
5. As an admin, I can review an immutable audit trail with clear before/after details.

**End of Phase 3:** run `testing_agent_v3` again; fix regressions.

---

### Phase 4 — Polish / Feedback Iteration
- Incorporate user feedback (workflow shortcuts, defaults, keyboard shortcuts, scan optimizations).
- Performance tuning: query optimization, caching of dashboard aggregates if needed.
- Accessibility and responsive refinements.

**Phase 4 user stories:**
1. As a manager, I can complete common tasks with fewer clicks via quick actions.
2. As a user, I get clear, friendly messages for validation and permission errors.
3. As a user, pages load quickly with pagination and smooth navigation.
4. As an admin, I can trust dashboard metrics match movement history.
5. As a user, the scanner experience is stable across mobile devices.

## 3. Next Actions
1. Implement Phase 1 POC backend endpoints + minimal schemas + indexes.
2. Add the Phase 1 Python concurrency test script; iterate until atomic stock behavior is correct.
3. Implement minimal React scanner + lookup screen to validate scan→find flow.
4. Once POC passes, generate full backend routes/models and then full frontend pages in Phase 2.

## 4. Success Criteria
- Stock **never goes negative**; exits are blocked reliably even under concurrent requests.
- Every stock change is traceable in movements; adjustments require reason and are audited.
- Scan flow works on mobile: scan → identify → entry/exit/view in seconds.
- RBAC enforced in backend and reflected in UI; Viewer cannot mutate data.
- Imports validate and preview errors before commit; exports respect filters.
- Dashboard, alerts, reports, and audit logs function with seeded demo data.
- E2E testing passes at the end of each phase with no P0/P1 bugs.