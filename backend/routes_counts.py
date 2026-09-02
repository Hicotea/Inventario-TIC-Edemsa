"""Stock count sessions (physical inventory)."""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional

from database import db
from models import CountCreate, CountOut, CountItemPayload
from auth import require_perm
from utils import uid, now_iso, write_audit

router = APIRouter(prefix="/counts", tags=["counts"])


@router.get("", response_model=List[CountOut])
async def list_counts(user: dict = Depends(require_perm("count:read"))):
    docs = await db.stock_counts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        d["items"] = d.get("items", [])
    return docs


@router.post("", response_model=CountOut, status_code=201)
async def create_count(payload: CountCreate, user: dict = Depends(require_perm("count:write"))):
    loc_name = None
    if payload.location_id:
        loc = await db.locations.find_one({"id": payload.location_id})
        loc_name = loc["name"] if loc else None
    doc = {
        "id": uid(),
        "name": payload.name,
        "location_id": payload.location_id,
        "location_name": loc_name,
        "notes": payload.notes,
        "status": "open",
        "created_by": user["id"],
        "created_by_name": user.get("full_name") or user.get("email"),
        "created_at": now_iso(),
        "items": [],
    }
    await db.stock_counts.insert_one(doc)
    await write_audit(user, "count.create", "stock_count", doc["id"], {"name": payload.name})
    return doc


@router.get("/{count_id}", response_model=CountOut)
async def get_count(count_id: str, user: dict = Depends(require_perm("count:read"))):
    doc = await db.stock_counts.find_one({"id": count_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, detail="Count session not found.")
    return doc


@router.post("/{count_id}/items", response_model=CountOut)
async def add_or_update_item(count_id: str, payload: CountItemPayload, user: dict = Depends(require_perm("count:write"))):
    session = await db.stock_counts.find_one({"id": count_id})
    if not session:
        raise HTTPException(404, detail="Count session not found.")
    if session["status"] != "open":
        raise HTTPException(400, detail="This session is closed.")
    product = await db.products.find_one({"id": payload.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, detail="Product not found.")
    system_qty = int(product.get("stock", 0))
    diff = int(payload.counted_qty) - system_qty
    item = {
        "product_id": product["id"],
        "product_sku": product["sku"],
        "product_name": product["name"],
        "system_qty": system_qty,
        "counted_qty": int(payload.counted_qty),
        "diff": diff,
        "counted_at": now_iso(),
        "counted_by": user.get("full_name") or user.get("email"),
    }
    # Upsert item (replace existing entry for the same product)
    await db.stock_counts.update_one({"id": count_id}, {"$pull": {"items": {"product_id": product["id"]}}})
    updated = await db.stock_counts.find_one_and_update(
        {"id": count_id}, {"$push": {"items": item}}, return_document=True, projection={"_id": 0}
    )
    return updated


@router.post("/{count_id}/close", response_model=CountOut)
async def close_count(count_id: str, apply_adjustments: bool = True, user: dict = Depends(require_perm("count:write"))):
    session = await db.stock_counts.find_one({"id": count_id})
    if not session:
        raise HTTPException(404, detail="Count session not found.")
    if session["status"] != "open":
        raise HTTPException(400, detail="This session is already closed.")
    # If admin/manager requested, generate adjustments for each discrepancy
    if apply_adjustments:
        for item in session.get("items", []):
            diff = int(item.get("diff", 0))
            if diff == 0:
                continue
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            if not product:
                continue
            previous = int(product.get("stock", 0))
            new_stock = int(item["counted_qty"])
            updated = await db.products.find_one_and_update(
                {"id": product["id"]},
                {"$set": {"stock": new_stock, "updated_at": now_iso()}},
                return_document=True,
            )
            await db.inventory_movements.insert_one({
                "id": uid(),
                "type": "adjustment",
                "product_id": product["id"],
                "product_sku": product["sku"],
                "product_name": product["name"],
                "qty": abs(new_stock - previous),
                "previous_stock": previous,
                "resulting_stock": updated["stock"],
                "user_id": user["id"],
                "user_name": user.get("full_name"),
                "reason": f"Physical count adjustment ({session['name']})",
                "created_at": now_iso(),
            })
    result = await db.stock_counts.find_one_and_update(
        {"id": count_id},
        {"$set": {"status": "closed", "closed_at": now_iso()}},
        return_document=True,
        projection={"_id": 0},
    )
    await write_audit(user, "count.close", "stock_count", count_id, {"apply_adjustments": apply_adjustments})
    return result


@router.delete("/{count_id}", status_code=204)
async def delete_count(count_id: str, user: dict = Depends(require_perm("count:write"))):
    r = await db.stock_counts.delete_one({"id": count_id})
    if r.deleted_count == 0:
        raise HTTPException(404, detail="Count session not found.")
    await write_audit(user, "count.delete", "stock_count", count_id)
    return
