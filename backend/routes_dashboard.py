"""Dashboard aggregates + alerts."""
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from database import db
from auth import require_perm
from models import AlertOut
from utils import uid, compute_status

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def dashboard_stats(user: dict = Depends(require_perm("product:read"))):
    products = await db.products.find({}, {"_id": 0}).to_list(5000)
    total_skus = len([p for p in products if p.get("is_active", True)])
    total_units = sum(int(p.get("stock", 0)) for p in products if p.get("is_active", True))
    low = 0
    out = 0
    for p in products:
        if not p.get("is_active", True):
            continue
        s = compute_status(p.get("stock", 0), p.get("min_stock", 0))
        if s == "low":
            low += 1
        elif s == "out":
            out += 1

    # Today's movement counts
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    entries_today = await db.inventory_movements.count_documents({"type": "entry", "created_at": {"$gte": today_start}})
    exits_today = await db.inventory_movements.count_documents({"type": "exit", "created_at": {"$gte": today_start}})
    adjustments_today = await db.inventory_movements.count_documents({"type": "adjustment", "created_at": {"$gte": today_start}})

    total_categories = await db.categories.count_documents({})
    total_locations = await db.locations.count_documents({})
    total_suppliers = await db.suppliers.count_documents({})

    return {
        "total_skus": total_skus,
        "total_units": total_units,
        "low_stock": low,
        "out_of_stock": out,
        "movements_today": entries_today + exits_today + adjustments_today,
        "entries_today": entries_today,
        "exits_today": exits_today,
        "adjustments_today": adjustments_today,
        "total_categories": total_categories,
        "total_locations": total_locations,
        "total_suppliers": total_suppliers,
    }


@router.get("/movements-timeseries")
async def movements_timeseries(user: dict = Depends(require_perm("movement:read")), days: int = 14):
    start = (datetime.now(timezone.utc) - timedelta(days=days)).replace(hour=0, minute=0, second=0, microsecond=0)
    cursor = db.inventory_movements.find(
        {"created_at": {"$gte": start.isoformat()}},
        {"_id": 0, "type": 1, "qty": 1, "created_at": 1},
    )
    docs = await cursor.to_list(20000)
    # Bucket per date
    buckets: dict = {}
    for i in range(days + 1):
        d = (start + timedelta(days=i)).date().isoformat()
        buckets[d] = {"date": d, "entries": 0, "exits": 0, "adjustments": 0}
    for m in docs:
        try:
            day = m["created_at"][:10]
            b = buckets.get(day)
            if not b:
                continue
            if m["type"] == "entry":
                b["entries"] += int(m.get("qty", 0))
            elif m["type"] == "exit":
                b["exits"] += int(m.get("qty", 0))
            else:
                b["adjustments"] += int(m.get("qty", 0))
        except Exception:
            continue
    return list(buckets.values())


@router.get("/category-distribution")
async def category_distribution(user: dict = Depends(require_perm("product:read"))):
    products = await db.products.find({"is_active": True}, {"_id": 0, "category_id": 1, "stock": 1}).to_list(5000)
    cats = await db.categories.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(500)
    id_to_name = {c["id"]: c["name"] for c in cats}
    counts: dict = {}
    units: dict = {}
    for p in products:
        key = id_to_name.get(p.get("category_id")) or "Uncategorized"
        counts[key] = counts.get(key, 0) + 1
        units[key] = units.get(key, 0) + int(p.get("stock", 0))
    result = [{"category": k, "products": counts[k], "units": units.get(k, 0)} for k in counts]
    result.sort(key=lambda x: -x["products"])
    return result


@router.get("/top-moved")
async def top_moved(user: dict = Depends(require_perm("movement:read")), days: int = 30, limit: int = 8):
    start = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    pipeline = [
        {"$match": {"created_at": {"$gte": start}}},
        {"$group": {"_id": {"pid": "$product_id", "sku": "$product_sku", "name": "$product_name"}, "total": {"$sum": "$qty"}, "count": {"$sum": 1}}},
        {"$sort": {"total": -1}},
        {"$limit": limit},
    ]
    result = []
    async for r in db.inventory_movements.aggregate(pipeline):
        result.append({
            "product_id": r["_id"]["pid"],
            "sku": r["_id"]["sku"],
            "name": r["_id"]["name"],
            "total_moved": r["total"],
            "movement_count": r["count"],
        })
    return result


@router.get("/alerts", response_model=List[AlertOut])
async def alerts(user: dict = Depends(require_perm("product:read"))):
    out: List[dict] = []
    products = await db.products.find({"is_active": True}, {"_id": 0}).to_list(5000)
    for p in products:
        s = compute_status(p.get("stock", 0), p.get("min_stock", 0))
        if s == "out":
            out.append({
                "id": f"out-{p['id']}",
                "kind": "out_of_stock",
                "product_id": p["id"],
                "product_name": p["name"],
                "product_sku": p["sku"],
                "message": f"{p['name']} is out of stock.",
                "severity": "error",
                "created_at": p.get("updated_at") or p.get("created_at"),
            })
        elif s == "low":
            out.append({
                "id": f"low-{p['id']}",
                "kind": "low_stock",
                "product_id": p["id"],
                "product_name": p["name"],
                "product_sku": p["sku"],
                "message": f"{p['name']} is below the minimum ({p.get('stock',0)} <= {p.get('min_stock',0)}).",
                "severity": "warn",
                "created_at": p.get("updated_at") or p.get("created_at"),
            })
        if not p.get("barcode") and not p.get("qr_code"):
            out.append({
                "id": f"code-{p['id']}",
                "kind": "missing_code",
                "product_id": p["id"],
                "product_name": p["name"],
                "product_sku": p["sku"],
                "message": f"{p['name']} has no QR/barcode assigned.",
                "severity": "info",
                "created_at": p.get("updated_at") or p.get("created_at"),
            })

    # No movements in last 60 days
    stale = (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()
    for p in products:
        recent = await db.inventory_movements.find_one({"product_id": p["id"], "created_at": {"$gte": stale}})
        if not recent and (p.get("stock", 0) > 0):
            out.append({
                "id": f"noomv-{p['id']}",
                "kind": "no_movement",
                "product_id": p["id"],
                "product_name": p["name"],
                "product_sku": p["sku"],
                "message": f"{p['name']} has had no movement in 60+ days.",
                "severity": "info",
                "created_at": p.get("updated_at") or p.get("created_at"),
            })
    # Sort by severity error > warn > info
    order = {"error": 0, "warn": 1, "info": 2}
    out.sort(key=lambda x: (order.get(x["severity"], 3), x["kind"], x["product_name"] or ""))
    return out
