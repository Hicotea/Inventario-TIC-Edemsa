"""Product CRUD routes + label/code endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional

from database import db
from models import ProductCreate, ProductUpdate, ProductOut
from auth import require_perm
from utils import (
    uid, now_iso, sanitize, write_audit,
    denormalize_product, denormalize_products,
    gen_qr_base64, gen_barcode_base64,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[ProductOut])
async def list_products(
    user: dict = Depends(require_perm("product:read")),
    q: Optional[str] = None,
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    location_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    status: Optional[str] = None,
    is_active: Optional[bool] = Query(True),  # <-- Filtrar por defecto los productos activos
    limit: int = Query(200, le=1000),
    skip: int = 0,
):
    query: dict = {}
    if q:
        # Combine text search + prefix on sku/barcode/qr
        query["$or"] = [
            {"sku": {"$regex": q, "$options": "i"}},
            {"name": {"$regex": q, "$options": "i"}},
            {"barcode": q},
            {"qr_code": q},
            {"model": {"$regex": q, "$options": "i"}},
        ]
    if category_id:
        query["category_id"] = category_id
    if brand_id:
        query["brand_id"] = brand_id
    if location_id:
        query["location_id"] = location_id
    if supplier_id:
        query["supplier_id"] = supplier_id
    if is_active is not None:
        query["is_active"] = is_active

    cursor = db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(limit)
    docs = await denormalize_products(docs)

    if status:
        docs = [d for d in docs if d["status"] == status]
    return docs


@router.post("", response_model=ProductOut, status_code=201)
async def create_product(payload: ProductCreate, user: dict = Depends(require_perm("product:write"))):
    if await db.products.find_one({"sku": payload.sku}):
        raise HTTPException(400, detail="Ya existe un producto con este SKU.")
    if payload.barcode and await db.products.find_one({"barcode": payload.barcode}):
        raise HTTPException(400, detail="Ya existe un producto con este código de barras.")

    doc = payload.model_dump()
    doc["id"] = uid()
    doc["stock"] = max(0, int(doc.pop("initial_stock", 0)))
    # Auto-generate codes if not provided
    if not doc.get("barcode"):
        doc["barcode"] = payload.sku  # SKU-based barcode fallback
    if not doc.get("qr_code"):
        doc["qr_code"] = f"QR-{doc['id']}"
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.products.insert_one(doc)

    # Create an initial-stock entry movement for full traceability
    if doc["stock"] > 0:
        await db.inventory_movements.insert_one({
            "id": uid(),
            "type": "entry",
            "product_id": doc["id"],
            "product_sku": doc["sku"],
            "product_name": doc["name"],
            "qty": doc["stock"],
            "previous_stock": 0,
            "resulting_stock": doc["stock"],
            "user_id": user["id"],
            "user_name": user.get("full_name"),
            "reason": "initial stock",
            "created_at": now_iso(),
        })

    await write_audit(user, "product.create", "product", doc["id"], {"sku": doc["sku"], "name": doc["name"]})
    return await denormalize_product(doc)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, user: dict = Depends(require_perm("product:read"))):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, detail="Producto no encontrado.")
    return await denormalize_product(doc)


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(product_id: str, payload: ProductUpdate, user: dict = Depends(require_perm("product:write"))):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(400, detail="No hay campos para actualizar.")
    updates["updated_at"] = now_iso()
    result = await db.products.find_one_and_update({"id": product_id}, {"$set": updates}, return_document=True)
    if not result:
        raise HTTPException(404, detail="Producto no encontrado.")
    await write_audit(user, "product.update", "product", product_id, updates)
    return await denormalize_product(sanitize(result))


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: str, user: dict = Depends(require_perm("product:delete"))):
    # Soft-delete by default via is_active=False if it has movements; hard delete otherwise
    has_movement = await db.inventory_movements.find_one({"product_id": product_id})
    if has_movement:
        result = await db.products.find_one_and_update(
            {"id": product_id}, {"$set": {"is_active": False, "updated_at": now_iso()}}
        )
        if not result:
            raise HTTPException(404, detail="Producto no encontrado.")
        await write_audit(user, "product.deactivate", "product", product_id)
    else:
        r = await db.products.delete_one({"id": product_id})
        if r.deleted_count == 0:
            raise HTTPException(404, detail="Producto no encontrado.")
        await write_audit(user, "product.delete", "product", product_id)
    return


@router.get("/{product_id}/codes")
async def product_codes(product_id: str, user: dict = Depends(require_perm("product:read"))):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, detail="Producto no encontrado.")
    qr_payload = p.get("qr_code") or f"QR-{product_id}"
    bc_payload = p.get("barcode") or p.get("sku")
    return {
        "qr_code": qr_payload,
        "barcode": bc_payload,
        "qr_png": gen_qr_base64(qr_payload),
        "barcode_png": gen_barcode_base64(bc_payload) if bc_payload else None,
    }


@router.get("/{product_id}/history")
async def product_history(product_id: str, user: dict = Depends(require_perm("product:read")), limit: int = 200):
    docs = await db.inventory_movements.find(
        {"product_id": product_id}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return docs


# ---------- Scan lookup (fast) ----------
scan = APIRouter(prefix="/scan", tags=["scan"])


@scan.get("/lookup")
async def scan_lookup(code: str, user: dict = Depends(require_perm("product:read"))):
    """Find a product by qr_code / barcode / sku (in that order)."""
    q = {"$or": [{"qr_code": code}, {"barcode": code}, {"sku": code}]}
    doc = await db.products.find_one(q, {"_id": 0})
    if not doc:
        raise HTTPException(404, detail="Ningún producto coincide con este código.")
    return await denormalize_product(doc)