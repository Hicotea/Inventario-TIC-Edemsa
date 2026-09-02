"""Master data routes: categories, brands, suppliers, locations."""
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from database import db
from models import NamedBase, NamedOut, SupplierBase, SupplierOut
from auth import require_perm
from utils import uid, now_iso, sanitize, write_audit

router = APIRouter(tags=["master"])


def _make_named_router(collection: str, entity_label: str):
    r = APIRouter(prefix=f"/{collection}")

    @r.get("", response_model=List[NamedOut])
    async def list_items(user: dict = Depends(require_perm("master:read"))):
        docs = await db[collection].find({}, {"_id": 0}).sort("name", 1).to_list(1000)
        return docs

    @r.post("", response_model=NamedOut, status_code=201)
    async def create_item(payload: NamedBase, user: dict = Depends(require_perm("master:write"))):
        if await db[collection].find_one({"name": payload.name}):
            raise HTTPException(400, detail=f"A {entity_label.lower()} with this name already exists.")
        doc = payload.model_dump()
        doc["id"] = uid()
        doc["created_at"] = now_iso()
        await db[collection].insert_one(doc)
        await write_audit(user, f"{entity_label}.create", entity_label, doc["id"], {"name": payload.name})
        return sanitize(doc)

    @r.patch("/{item_id}", response_model=NamedOut)
    async def update_item(item_id: str, payload: NamedBase, user: dict = Depends(require_perm("master:write"))):
        updates = payload.model_dump()
        updates["updated_at"] = now_iso()
        result = await db[collection].find_one_and_update({"id": item_id}, {"$set": updates}, return_document=True)
        if not result:
            raise HTTPException(404, detail=f"{entity_label} not found.")
        await write_audit(user, f"{entity_label}.update", entity_label, item_id, {"name": payload.name})
        return sanitize(result)

    @r.delete("/{item_id}", status_code=204)
    async def delete_item(item_id: str, user: dict = Depends(require_perm("master:write"))):
        # Check refs from products
        ref_field = {"categories": "category_id", "brands": "brand_id", "locations": "location_id"}[collection]
        if await db.products.find_one({ref_field: item_id}):
            raise HTTPException(400, detail=f"Cannot delete: {entity_label.lower()} is used by one or more products.")
        r2 = await db[collection].delete_one({"id": item_id})
        if r2.deleted_count == 0:
            raise HTTPException(404, detail=f"{entity_label} not found.")
        await write_audit(user, f"{entity_label}.delete", entity_label, item_id)
        return

    return r


router.include_router(_make_named_router("categories", "Category"))
router.include_router(_make_named_router("brands", "Brand"))
router.include_router(_make_named_router("locations", "Location"))


# Suppliers get their own router because they have more fields.
sup = APIRouter(prefix="/suppliers", tags=["master"])


@sup.get("", response_model=List[SupplierOut])
async def list_suppliers(user: dict = Depends(require_perm("master:read"))):
    return await db.suppliers.find({}, {"_id": 0}).sort("name", 1).to_list(1000)


@sup.post("", response_model=SupplierOut, status_code=201)
async def create_supplier(payload: SupplierBase, user: dict = Depends(require_perm("master:write"))):
    if await db.suppliers.find_one({"name": payload.name}):
        raise HTTPException(400, detail="A supplier with this name already exists.")
    doc = payload.model_dump()
    doc["id"] = uid()
    doc["created_at"] = now_iso()
    await db.suppliers.insert_one(doc)
    await write_audit(user, "Supplier.create", "Supplier", doc["id"], {"name": payload.name})
    return sanitize(doc)


@sup.patch("/{sid}", response_model=SupplierOut)
async def update_supplier(sid: str, payload: SupplierBase, user: dict = Depends(require_perm("master:write"))):
    updates = payload.model_dump()
    updates["updated_at"] = now_iso()
    result = await db.suppliers.find_one_and_update({"id": sid}, {"$set": updates}, return_document=True)
    if not result:
        raise HTTPException(404, detail="Supplier not found.")
    await write_audit(user, "Supplier.update", "Supplier", sid, {"name": payload.name})
    return sanitize(result)


@sup.delete("/{sid}", status_code=204)
async def delete_supplier(sid: str, user: dict = Depends(require_perm("master:write"))):
    if await db.products.find_one({"supplier_id": sid}):
        raise HTTPException(400, detail="Cannot delete: supplier is linked to one or more products.")
    r = await db.suppliers.delete_one({"id": sid})
    if r.deleted_count == 0:
        raise HTTPException(404, detail="Supplier not found.")
    await write_audit(user, "Supplier.delete", "Supplier", sid)
    return


router.include_router(sup)
