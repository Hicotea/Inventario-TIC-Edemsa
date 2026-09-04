"""Inventory movement routes: entries, exits, adjustments, history."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from database import db
from models import EntryCreate, ExitCreate, AdjustmentCreate, MovementOut
from auth import require_perm
from utils import uid, now_iso, write_audit

router = APIRouter(prefix="/movements", tags=["movements"])


async def _load_product(pid: str) -> dict:
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, detail="Producto no encontrado.")
    if not p.get("is_active", True):
        raise HTTPException(400, detail="El producto está inactivo. Actívelo antes de registrar movimientos.")
    return p


async def _resolve_supplier_name(sid: Optional[str]) -> Optional[str]:
    if not sid:
        return None
    s = await db.suppliers.find_one({"id": sid}, {"_id": 0, "name": 1})
    return s["name"] if s else None


async def _resolve_location_name(lid: Optional[str]) -> Optional[str]:
    if not lid:
        return None
    l = await db.locations.find_one({"id": lid}, {"_id": 0, "name": 1})
    return l["name"] if l else None


@router.get("", response_model=List[MovementOut])
async def list_movements(
    user: dict = Depends(require_perm("movement:read")),
    q: Optional[str] = None,
    type: Optional[str] = None,
    product_id: Optional[str] = None,
    user_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(200, le=1000),
    skip: int = 0,
):
    query: dict = {}
    if type:
        query["type"] = type
    if product_id:
        query["product_id"] = product_id
    if user_id:
        query["user_id"] = user_id
    if supplier_id:
        query["supplier_id"] = supplier_id
    if q:
        query["$or"] = [
            {"product_sku": {"$regex": q, "$options": "i"}},
            {"product_name": {"$regex": q, "$options": "i"}},
            {"reason": {"$regex": q, "$options": "i"}},
            {"reference": {"$regex": q, "$options": "i"}},
            {"requester": {"$regex": q, "$options": "i"}},
            {"recipient_name": {"$regex": q, "$options": "i"}},
            {"recipient_document": {"$regex": q, "$options": "i"}},
            {"department": {"$regex": q, "$options": "i"}},
            {"serial_number": {"$regex": q, "$options": "i"}},
            {"placa": {"$regex": q, "$options": "i"}},
            {"device_name": {"$regex": q, "$options": "i"}},
        ]
    if date_from or date_to:
        query["created_at"] = {}
        if date_from:
            query["created_at"]["$gte"] = date_from
        if date_to:
            query["created_at"]["$lte"] = date_to

    docs = await db.inventory_movements.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return docs


@router.post("/entry", response_model=MovementOut, status_code=201)
async def register_entry(payload: EntryCreate, user: dict = Depends(require_perm("movement:write"))):
    if payload.qty <= 0:
        raise HTTPException(400, detail="La cantidad debe ser mayor que cero.")
    p = await _load_product(payload.product_id)

    updated = await db.products.find_one_and_update(
        {"id": payload.product_id},
        {"$inc": {"stock": payload.qty}, "$set": {"updated_at": now_iso()}},
        return_document=True,
    )
    if not updated:
        raise HTTPException(500, detail="No se pudo actualizar el stock.")
    previous_stock = updated["stock"] - payload.qty

    mv = {
        "id": uid(),
        "type": "entry",
        "product_id": p["id"],
        "product_sku": p["sku"],
        "product_name": p["name"],
        "qty": payload.qty,
        "previous_stock": previous_stock,
        "resulting_stock": updated["stock"],
        "user_id": user["id"],
        "user_name": user.get("full_name") or user.get("email"),
        "reason": payload.reason or "purchase",
        "notes": payload.notes,
        "reference": payload.reference,
        "supplier_id": payload.supplier_id,
        "supplier_name": await _resolve_supplier_name(payload.supplier_id),
        "location_id": p.get("location_id"),
        "location_name": await _resolve_location_name(p.get("location_id")),
        "unit_cost": payload.unit_cost,
        "created_at": now_iso(),
    }
    await db.inventory_movements.insert_one(mv)
    await write_audit(user, "movement.entry", "movement", mv["id"], {"product": p["sku"], "qty": payload.qty})
    return mv


@router.post("/exit", response_model=MovementOut, status_code=201)
async def register_exit(payload: ExitCreate, user: dict = Depends(require_perm("movement:write"))):
    if payload.qty <= 0:
        raise HTTPException(400, detail="La cantidad debe ser mayor que cero.")
    p = await _load_product(payload.product_id)

    updated = await db.products.find_one_and_update(
        {"id": payload.product_id, "stock": {"$gte": payload.qty}},
        {"$inc": {"stock": -payload.qty}, "$set": {"updated_at": now_iso()}},
        return_document=True,
    )
    if not updated:
        current = await db.products.find_one({"id": payload.product_id}, {"_id": 0, "stock": 1})
        cur = current["stock"] if current else 0
        raise HTTPException(400, detail=f"Stock insuficiente. Disponible: {cur}, solicitado: {payload.qty}.")

    previous_stock = updated["stock"] + payload.qty
    recipient = getattr(payload, "recipient_name", None) or payload.requester

    mv = {
        "id": uid(),
        "type": "exit",
        "product_id": p["id"],
        "product_sku": p["sku"],
        "product_name": p["name"],
        "qty": payload.qty,
        "previous_stock": previous_stock,
        "resulting_stock": updated["stock"],
        "user_id": user["id"],
        "user_name": user.get("full_name") or user.get("email"),
        "reason": payload.reason or "consumption",
        "notes": payload.notes,
        "reference": payload.reference,
        "destination": payload.destination,
        "requester": recipient,
        "recipient_name": recipient,
        "recipient_document": getattr(payload, "recipient_document", None),
        "department": getattr(payload, "department", None),
        "serial_number": getattr(payload, "serial_number", None),
        "condition": getattr(payload, "condition", None) or "Bueno",
        "placa": getattr(payload, "placa", None),
        "device_name": getattr(payload, "device_name", None),
        "location_id": p.get("location_id"),
        "location_name": await _resolve_location_name(p.get("location_id")),
        "created_at": now_iso(),
    }
    await db.inventory_movements.insert_one(mv)
    await write_audit(user, "movement.exit", "movement", mv["id"], {
        "product": p["sku"], 
        "qty": payload.qty, 
        "recipient": recipient,
        "serial_number": getattr(payload, "serial_number", None),
        "placa": getattr(payload, "placa", None),
        "device_name": getattr(payload, "device_name", None)
    })
    return mv


@router.post("/adjustment", response_model=MovementOut, status_code=201)
async def register_adjustment(payload: AdjustmentCreate, user: dict = Depends(require_perm("adjustment:write"))):
    p = await _load_product(payload.product_id)
    previous_stock = int(p.get("stock", 0))
    diff = int(payload.new_stock) - previous_stock
    if diff == 0:
        raise HTTPException(400, detail="El ajuste debe modificar la cantidad en stock.")

    updated = await db.products.find_one_and_update(
        {"id": payload.product_id},
        {"$set": {"stock": int(payload.new_stock), "updated_at": now_iso()}},
        return_document=True,
    )
    mv = {
        "id": uid(),
        "type": "adjustment",
        "product_id": p["id"],
        "product_sku": p["sku"],
        "product_name": p["name"],
        "qty": abs(diff),
        "previous_stock": previous_stock,
        "resulting_stock": updated["stock"],
        "user_id": user["id"],
        "user_name": user.get("full_name") or user.get("email"),
        "reason": payload.reason,
        "notes": payload.notes,
        "location_id": p.get("location_id"),
        "location_name": await _resolve_location_name(p.get("location_id")),
        "created_at": now_iso(),
    }
    await db.inventory_movements.insert_one(mv)
    await write_audit(user, "movement.adjustment", "movement", mv["id"], {
        "product": p["sku"], "previous": previous_stock, "new": payload.new_stock, "diff": diff, "reason": payload.reason,
    })
    return mv