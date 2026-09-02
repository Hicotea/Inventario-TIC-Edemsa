"""Main FastAPI app for IT Inventory Management System."""
import logging
import os
from pathlib import Path

from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from database import client, ensure_indexes  # noqa: E402
from seed import seed_all  # noqa: E402
from routes_auth import router as auth_router  # noqa: E402
from routes_users import router as users_router  # noqa: E402
from routes_master import router as master_router  # noqa: E402
from routes_products import router as products_router, scan as scan_router  # noqa: E402
from routes_movements import router as movements_router  # noqa: E402
from routes_dashboard import router as dashboard_router  # noqa: E402
from routes_reports import router as reports_router  # noqa: E402
from routes_audit import router as audit_router  # noqa: E402
from routes_counts import router as counts_router  # noqa: E402
from routes_settings import router as settings_router  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("it-inventory")

app = FastAPI(title="IT Inventory Management System", version="1.0.0")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "IT Inventory Management", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(master_router)
api_router.include_router(products_router)
api_router.include_router(scan_router)
api_router.include_router(movements_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)
api_router.include_router(audit_router)
api_router.include_router(counts_router)
api_router.include_router(settings_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Friendlier validation errors
    errors = exc.errors()
    first = errors[0] if errors else {}
    field = ".".join(str(x) for x in first.get("loc", [])[-1:]) if first else ""
    msg = first.get("msg") if first else "Invalid input."
    friendly = f"{field}: {msg}" if field else msg
    return JSONResponse(status_code=422, content={"detail": friendly, "errors": errors})


@app.on_event("startup")
async def _startup():
    try:
        await ensure_indexes()
        await seed_all()
        logger.info("IT Inventory: indexes ensured and seed data verified.")
    except Exception as e:
        logger.exception(f"Startup routine failed: {e}")


@app.on_event("shutdown")
async def _shutdown():
    client.close()
