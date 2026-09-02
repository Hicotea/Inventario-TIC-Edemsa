# Stockroom OS — Enterprise IT Inventory Management

A production-ready, full-stack inventory system for IT departments. Track every part from receiving to the last cable, with real-time stock levels, atomic inventory movements, QR / barcode scanning from the browser, role-based access control, and a fully immutable audit trail.

Built on the **FARM stack**: **F**astAPI (Python) · **R**eact (JS) · **M**ongoDB (Motor async driver).

---

## Table of Contents

1. [Feature Highlights](#feature-highlights)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Default Credentials & Seed Data](#default-credentials--seed-data)
8. [Running the App](#running-the-app)
9. [Core Workflows](#core-workflows)
10. [API Reference](#api-reference)
11. [RBAC & Permissions](#rbac--permissions)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)
14. [License](#license)

---

## Feature Highlights

| Area | Capabilities |
|------|--------------|
| **Auth & Security** | JWT (access token), bcrypt password hashing, role-based route guards, protected `/api/*` routes |
| **Products** | Full CRUD with unique SKU, category/brand/location/supplier relations, min-stock thresholds, status flags |
| **Codes** | Auto-generated QR code + Code128 barcode PNGs per product, printable label view |
| **Movements** | Atomic **entry / exit / adjustment** operations using MongoDB `find_one_and_update` with conditional filter — **stock can never go negative** even under high concurrency |
| **Scanner** | Browser-based QR / barcode scanning via `html5-qrcode` (mobile-first), plus manual code entry fallback |
| **Physical Counts** | Session-based counting workflow: create session → scan/count items → close session generates the required adjustments automatically |
| **Master Data** | CRUD for Categories, Brands, Locations, Suppliers |
| **Dashboard** | Real-time KPIs, 14-day movements time-series, category distribution donut, alerts panel, top-moved products |
| **Alerts** | Low stock, out of stock, missing codes, no-movement windows |
| **Reports** | Inventory snapshot + Movements aggregation, exportable to **CSV / XLSX / PDF** |
| **Import** | Excel template download, upload validation with preview & row-level errors before commit |
| **Audit** | Immutable audit log for every write action (create / update / delete / movement) |
| **RBAC** | Three built-in roles (Admin / Manager / Viewer) enforced on both backend and UI |

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                      Browser (React SPA)                       │
│  Login · Dashboard · Products · Movements · Scanner · Reports  │
│  Sidebar → grouped nav │ Sonner toasts │ shadcn/ui + Tailwind  │
└───────────────────┬───────────────────────────────────────────┘
                    │  fetch (REACT_APP_BACKEND_URL + /api/*)
                    ▼
┌───────────────────────────────────────────────────────────────┐
│                    FastAPI Backend  (uvicorn)                  │
│  /api/auth       /api/products   /api/movements   /api/scan    │
│  /api/master/*   /api/counts     /api/dashboard   /api/reports │
│  /api/users      /api/audit      /api/import      /api/settings│
│  JWT middleware · RBAC deps · Pydantic validation · Audit log  │
└───────────────────┬───────────────────────────────────────────┘
                    │  Motor (async)
                    ▼
┌───────────────────────────────────────────────────────────────┐
│                          MongoDB                               │
│  users · roles · products · categories · brands · locations    │
│  suppliers · movements · counts · alerts · audit_logs          │
└───────────────────────────────────────────────────────────────┘
```

### Atomic Stock Guarantee

Every stock-changing request is executed as a single conditional update:

```python
# routes_movements.py (simplified)
result = await db.products.find_one_and_update(
    {"_id": product_id, "stock": {"$gte": qty}},   # ← conditional filter
    {"$inc": {"stock": -qty}, "$set": {"updated_at": now_utc}},
    return_document=ReturnDocument.AFTER,
)
if not result:                                     # nothing matched → insufficient stock
    raise HTTPException(400, "Insufficient stock")
# same request writes the movement + audit_log
```

Verified under load: **30 parallel exits on stock=10 → exactly 10 succeed, 20 rejected, final stock = 0, never negative.**

---

## Tech Stack

**Backend**
- FastAPI · Uvicorn · Pydantic
- Motor (async MongoDB driver)
- PyJWT · bcrypt · passlib
- qrcode · python-barcode · reportlab · openpyxl

**Frontend**
- React 18 · React Router v6
- Tailwind CSS + shadcn/ui component library
- Recharts (charts) · Sonner (toasts)
- html5-qrcode (camera scanning) · axios · date-fns

**Infra**
- MongoDB (via `MONGO_URL`)
- Supervisor (process management)
- Kubernetes ingress: `/api/*` → backend :8001, everything else → frontend :3000

---

## Project Structure

```
/app
├── backend
│   ├── server.py                  # FastAPI app, CORS, router mounting, startup seed
│   ├── database.py                # Motor client, index setup
│   ├── models.py                  # Pydantic + Mongo document models
│   ├── auth.py                    # JWT + bcrypt + role dependencies
│   ├── utils.py                   # QR / barcode / helpers
│   ├── seed.py                    # Idempotent seed data (users, categories, 30 products, movements)
│   ├── routes_auth.py             # /api/auth
│   ├── routes_users.py            # /api/users (admin)
│   ├── routes_products.py         # /api/products + /api/scan/lookup
│   ├── routes_master.py           # /api/master/{categories,brands,locations,suppliers}
│   ├── routes_movements.py        # /api/movements (entry / exit / adjustment)
│   ├── routes_counts.py           # /api/counts (physical count sessions)
│   ├── routes_dashboard.py        # /api/dashboard (stats, timeseries, alerts, distribution)
│   ├── routes_reports.py          # /api/reports (+ CSV / XLSX / PDF exports)
│   ├── routes_audit.py            # /api/audit (admin)
│   ├── routes_settings.py         # /api/settings (roles / permissions)
│   ├── test_core.py               # POC concurrent-oversell script
│   └── requirements.txt
│
├── frontend
│   ├── src
│   │   ├── App.js                 # Router + AuthProvider + AppShell
│   │   ├── lib
│   │   │   ├── api.js             # Axios instance, interceptors
│   │   │   └── auth.jsx           # Auth context + useAuth hook
│   │   ├── components
│   │   │   ├── layout             # AppShell, Sidebar, Topbar, Breadcrumbs
│   │   │   └── ui                 # shadcn primitives
│   │   └── pages
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Products.jsx · ProductForm.jsx · ProductDetail.jsx
│   │       ├── Movements.jsx · MovementForm.jsx
│   │       ├── Scanner.jsx
│   │       ├── Alerts.jsx
│   │       ├── Counts.jsx · CountSession.jsx
│   │       ├── Reports.jsx
│   │       ├── ImportProducts.jsx
│   │       ├── Categories.jsx · Brands.jsx · Locations.jsx · Suppliers.jsx
│   │       ├── Users.jsx
│   │       ├── Audit.jsx
│   │       └── Settings.jsx
│   ├── tailwind.config.js
│   └── package.json
│
├── design_guidelines.md           # Design tokens: colors, typography, spacing
├── plan.md                        # Development plan (phases, user stories, status)
├── test_reports/                  # E2E test JSON reports
└── README.md                      # ← you are here
```

---

## Getting Started

### Prerequisites
- **Python** 3.11+
- **Node.js** 18+ and **Yarn** (npm is not used)
- **MongoDB** 6+ (local or connection string)
- Modern browser with camera access (Chrome / Edge / Safari on iOS 14.3+)

### Cloning
```bash
git clone <repo-url> stockroom-os
cd stockroom-os
```

### Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend (use yarn, not npm)
cd ../frontend
yarn install
```

---

## Environment Variables

Both `.env` files ship pre-configured for the managed Emergent environment.
For local / self-hosted setup, edit them:

### `backend/.env`

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017/stockroom` |
| `DB_NAME` | Database name (optional; defaults to `stockroom`) | `stockroom` |
| `JWT_SECRET` | Secret used to sign JWTs. **Rotate in production.** | `super-secret-change-me` |
| `JWT_TTL_HOURS` | Token lifetime | `12` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:3000` |

### `frontend/.env`

| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_BACKEND_URL` | Full origin of the backend (no trailing slash, no `/api`) | `http://localhost:8001` |

> **⚠️ Do NOT rewrite these files in the managed environment** — the platform pre-configures both `MONGO_URL` and `REACT_APP_BACKEND_URL` and modifying them will break the Kubernetes ingress mapping.

---

## Default Credentials & Seed Data

On first boot the backend runs an **idempotent seed** (safe to run multiple times):

| Role | Email | Password | Capabilities |
|------|-------|----------|--------------|
| **Admin** | `admin@company.com` | `Admin123!` | Full access — users, audit, settings, all writes |
| **Manager** | `manager@company.com` | `Manager123!` | Products, movements, counts, master data, reports |
| **Viewer** | `viewer@company.com` | `Viewer123!` | Read-only across every module |

The seed also creates:
- **10 categories** (Networking, Peripherals, Storage, Power, Cabling, Tools, Consumables, Spare Parts, Accessories, Computers)
- **~8 brands · 5 locations · 5 suppliers**
- **30 products** with realistic SKUs, stock levels, min-stock, and pre-generated QR / barcode payloads
- **~30 sample movements** spanning the last 14 days (drives the dashboard charts)
- Sample **alerts** (low stock, out of stock)

To reseed from scratch (destructive):
```bash
cd backend
python -c "import asyncio; from seed import reset_and_seed; asyncio.run(reset_and_seed())"
```

---

## Running the App

### Managed Environment (Supervisor)
Both services run under supervisor with hot-reload enabled:
```bash
supervisorctl status                # verify all services RUNNING
supervisorctl restart backend       # after backend .env or dependency changes
supervisorctl restart frontend      # after frontend .env changes
tail -n 100 /var/log/supervisor/backend.*.log
tail -n 100 /var/log/supervisor/frontend.*.log
```

Then open the preview URL (or `http://localhost:3000` locally) and log in with the admin account.

### Local Development

```bash
# Terminal 1 — backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 — frontend
cd frontend
yarn start          # opens http://localhost:3000
```

### Production Build

```bash
# Frontend static assets
cd frontend
yarn build          # outputs /frontend/build ready to serve via nginx / any CDN

# Backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

---

## Core Workflows

### 1. Register a Product
Products → **New Product** → fill SKU / name / category / location / min-stock → save. The system auto-generates a QR code and Code128 barcode; view them on the product detail page or print a label sheet.

### 2. Register an Entry (Receiving)
Movements → **Entry** → pick product (or **scan its code**) → enter quantity + optional reason → submit. Stock increases atomically and a movement + audit-log row are written in the same request.

### 3. Register an Exit (Deployment / Consumption)
Movements → **Exit** → pick product → enter quantity → submit.
If quantity > current stock, the backend rejects the request with **400 Insufficient stock** and stock stays untouched. A toast informs the user.

### 4. Adjustment (Physical Reconciliation)
Movements → **Adjustment** → pick product → set the actual on-hand quantity + reason (required). System writes a delta movement and updates stock.

### 5. Scan-First Flow (Mobile)
Scanner → grant camera permission → point at any QR / barcode → product resolves instantly → tap **Entry / Exit / View** to act.

### 6. Physical Count Session
Physical Counts → **New Session** → name it → scan each item as you count → **Close Session**. The backend generates one adjustment movement per discrepancy and closes the session.

### 7. Bulk Import
Import → **Download Template** (Excel) → fill rows → **Upload** → review validation preview (row-level errors) → **Commit** to persist only valid rows.

### 8. Reports & Exports
Reports → pick Inventory or Movements → apply filters → **Export CSV / XLSX / PDF**.

---

## API Reference

Base URL: **`{REACT_APP_BACKEND_URL}/api`**

All non-auth endpoints require `Authorization: Bearer <jwt>`.
Interactive Swagger docs are auto-generated at **`GET /api/docs`**.

### Auth
| Method | Path | Body / Notes |
|--------|------|--------------|
| POST | `/auth/login` | `{ email, password }` → `{ access_token, user }` |
| GET | `/auth/me` | current user |

### Products
| Method | Path | Notes |
|--------|------|-------|
| GET | `/products` | query: `search`, `category`, `brand`, `location`, `status`, `page`, `limit` |
| POST | `/products` | manager+ |
| GET | `/products/{id}` | detail |
| PATCH | `/products/{id}` | manager+ |
| DELETE | `/products/{id}` | admin (blocked if stock > 0) |
| GET | `/products/{id}/codes` | QR + barcode PNG (base64) |
| GET | `/scan/lookup?code=...` | resolve by SKU / QR / barcode |

### Movements
| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/movements` | filters: type, product_id, date_from, date_to, user_id | |
| POST | `/movements/entry` | `{ product_id, qty, reason? }` | atomic +qty |
| POST | `/movements/exit` | `{ product_id, qty, reason? }` | atomic -qty, blocks if insufficient |
| POST | `/movements/adjustment` | `{ product_id, new_stock, reason }` | reason required |

### Master Data
CRUD under `/master/categories`, `/master/brands`, `/master/locations`, `/master/suppliers`.

### Physical Counts
`POST /counts` → `POST /counts/{id}/items` → `POST /counts/{id}/close`

### Dashboard
`GET /dashboard/stats`, `/dashboard/movements-timeseries`, `/dashboard/category-distribution`, `/dashboard/alerts`

### Reports & Import
`GET /reports/inventory`, `/reports/movements` — each with `?format=csv|xlsx|pdf` export variant.
`GET /import/template` → `POST /import/validate` → `POST /import/commit`.

### Admin
`/users` (CRUD), `/audit` (read-only, admin only), `/settings/roles` (permissions matrix).

---

## RBAC & Permissions

| Capability | Admin | Manager | Viewer |
|------------|:-----:|:-------:|:------:|
| View everything | ✅ | ✅ | ✅ |
| Create / edit products | ✅ | ✅ | ❌ |
| Register movements | ✅ | ✅ | ❌ |
| Manage master data | ✅ | ✅ | ❌ |
| Run physical counts | ✅ | ✅ | ❌ |
| Import / export | ✅ | ✅ | Export only |
| Manage users | ✅ | ❌ | ❌ |
| View audit log | ✅ | ❌ | ❌ |
| Manage role permissions | ✅ | ❌ | ❌ |

Enforced on both backend (route dependencies) and frontend (sidebar visibility + disabled action buttons).

---

## Testing

The repository ships with two comprehensive E2E test reports plus a POC script:

| File | Coverage | Result |
|------|----------|--------|
| `backend/test_core.py` | Concurrent oversell POC (30 parallel exits on stock=10) | ✅ never goes negative |
| `test_reports/iteration_1.json` | 56 backend scenarios (auth, RBAC, atomic stock, CRUD, dashboard, reports, imports) | ✅ 56 / 56 |
| `test_reports/iteration_2.json` | 30 frontend scenarios (all routes, RBAC UI, forms, charts, toasts, responsive) | ✅ 30 / 30 |

Run the POC yourself:
```bash
cd backend
python test_core.py
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `401 Unauthorized` after a while | JWT expired — log out and back in, or lengthen `JWT_TTL_HOURS`. |
| Scanner shows a black screen | Camera permission blocked, or page served over HTTP. Camera APIs require HTTPS (or `localhost`). |
| "Insufficient stock" toast on exit | Working as designed — never sells below zero. Check current stock on product detail. |
| Login says "Invalid credentials" for a seeded user | Reseed database (see [Seed Data](#default-credentials--seed-data)) or verify `MONGO_URL` points to the right DB. |
| Charts empty on dashboard | Reseed to populate the last-14-days sample movements. |
| Import upload fails validation | Download the fresh template — column order and headers must match exactly. |
| Frontend can't reach backend | Confirm `REACT_APP_BACKEND_URL` in `frontend/.env` matches your backend origin and `CORS_ORIGINS` allows it. |

Check service logs anytime:
```bash
tail -n 100 /var/log/supervisor/backend.*.log
tail -n 100 /var/log/supervisor/frontend.*.log
```

---

## License

Internal / proprietary. Adapt as needed for your organization.
