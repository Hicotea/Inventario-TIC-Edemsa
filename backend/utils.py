"""Utility functions: QR/barcode generation, serialization, status logic."""
import base64
import io
import uuid
from datetime import datetime, timezone
from typing import Optional

import qrcode
import barcode
from barcode.writer import ImageWriter

from database import db


def uid() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sanitize(doc: dict) -> dict:
    """Remove Mongo _id and password from a document copy."""
    if not doc:
        return doc
    out = {k: v for k, v in doc.items() if k not in ("_id", "password")}
    return out


def compute_status(stock: int, min_stock: int, is_active: bool = True) -> str:
    if not is_active:
        return "inactive"
    if stock <= 0:
        return "out"
    if stock <= (min_stock or 0):
        return "low"
    return "available"


def gen_qr_base64(payload: str) -> str:
    img = qrcode.make(payload)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def gen_barcode_base64(payload: str, code_type: str = "code128") -> str:
    # code128 accepts alphanumeric; safe fallback
    try:
        code = barcode.get(code_type, payload, writer=ImageWriter())
        buf = io.BytesIO()
        code.write(buf, options={"write_text": True, "module_height": 12.0, "font_size": 8, "quiet_zone": 2.0})
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception:
        # fallback to QR if payload not barcode-safe
        return gen_qr_base64(payload)


async def denormalize_product(p: dict) -> dict:
    """Attach category/brand/location/supplier names for list views."""
    out = dict(p)
    out["status"] = compute_status(p.get("stock", 0), p.get("min_stock", 0), p.get("is_active", True))

    async def _name(col: str, _id: Optional[str]) -> Optional[str]:
        if not _id:
            return None
        d = await db[col].find_one({"id": _id}, {"_id": 0, "name": 1})
        return d["name"] if d else None

    out["category_name"] = await _name("categories", p.get("category_id"))
    out["brand_name"] = await _name("brands", p.get("brand_id"))
    out["location_name"] = await _name("locations", p.get("location_id"))
    out["supplier_name"] = await _name("suppliers", p.get("supplier_id"))
    return out


async def denormalize_products(products: list) -> list:
    if not products:
        return []
    # Preload master name maps once for efficiency
    async def _map(col: str) -> dict:
        cursor = db[col].find({}, {"_id": 0, "id": 1, "name": 1})
        return {d["id"]: d["name"] async for d in cursor}

    cats = await _map("categories")
    brands = await _map("brands")
    locs = await _map("locations")
    sups = await _map("suppliers")

    out = []
    for p in products:
        d = dict(p)
        d["status"] = compute_status(p.get("stock", 0), p.get("min_stock", 0), p.get("is_active", True))
        d["category_name"] = cats.get(p.get("category_id"))
        d["brand_name"] = brands.get(p.get("brand_id"))
        d["location_name"] = locs.get(p.get("location_id"))
        d["supplier_name"] = sups.get(p.get("supplier_id"))
        out.append(d)
    return out


async def write_audit(user: dict, action: str, entity: str, entity_id: Optional[str] = None, details: Optional[dict] = None):
    await db.audit_logs.insert_one({
        "id": uid(),
        "user_id": user["id"],
        "user_name": user.get("full_name") or user.get("email"),
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "details": details or {},
        "created_at": now_iso(),
    })
