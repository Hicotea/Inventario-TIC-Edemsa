"""Seed initial admin user + demo master data + demo products + a few movements.
Idempotent: safe to run multiple times.
"""
import asyncio
import random
from datetime import datetime, timezone, timedelta

from database import db
from auth import hash_password
from utils import uid, now_iso

DEFAULT_ADMIN = {
    "email": "admin@company.com",
    "password": "Admin123!",
    "full_name": "System Administrator",
    "role": "admin",
}


DEMO_USERS = [
    {"email": "manager@company.com", "password": "Manager123!", "full_name": "Inventory Manager", "role": "manager"},
    {"email": "viewer@company.com", "password": "Viewer123!", "full_name": "Read Only Viewer", "role": "viewer"},
]

CATEGORIES = [
    "Peripherals", "Cabling", "Networking", "Storage", "Power",
    "Printing", "Accessories", "Spare Parts", "Consumables", "Tools",
]
BRANDS = ["Logitech", "Dell", "HP", "Kingston", "Cisco", "TP-Link", "Anker", "Belkin", "Samsung", "Sandisk"]
LOCATIONS = ["IT Storage Room", "Main Warehouse", "Rack A-01", "Rack A-02", "IT Office Cabinet", "Server Room Shelf"]
SUPPLIERS = [
    {"name": "TechSupplier Co.", "email": "sales@techsupplier.example", "phone": "+1-555-0101", "contact_name": "Alex Chen"},
    {"name": "OfficePro Distribution", "email": "orders@officepro.example", "phone": "+1-555-0102", "contact_name": "Sam Rivera"},
    {"name": "NetGear Direct", "email": "support@netgear.example", "phone": "+1-555-0103", "contact_name": "Priya Patel"},
    {"name": "CablesRUs LLC", "email": "hi@cablesrus.example", "phone": "+1-555-0104", "contact_name": "Jamie Wu"},
]

DEMO_PRODUCTS = [
    # (sku, name, category, brand, unit_cost, min, max, initial_stock)
    ("KB-001", "USB Keyboard", "Peripherals", "Logitech", 12.99, 5, 100, 45),
    ("MS-101", "Wireless Mouse", "Peripherals", "Logitech", 19.90, 5, 100, 62),
    ("MS-201", "Ergonomic Mouse", "Peripherals", "Anker", 24.50, 3, 50, 8),
    ("HS-301", "USB Headset", "Peripherals", "HP", 34.00, 4, 50, 22),
    ("WC-401", "1080p Webcam", "Peripherals", "Logitech", 49.99, 3, 40, 4),
    ("CBL-HDMI-2", "HDMI 2m Cable", "Cabling", "Belkin", 6.50, 20, 300, 180),
    ("CBL-USB-C-1", "USB-C 1m Cable", "Cabling", "Anker", 8.75, 20, 300, 210),
    ("CBL-ETH-3", "Cat6 Ethernet 3m", "Cabling", "Belkin", 4.20, 30, 500, 25),
    ("CBL-PWR-EU", "Power Cable EU", "Cabling", "HP", 3.10, 40, 500, 0),
    ("AD-USB-C-HDMI", "USB-C to HDMI Adapter", "Accessories", "Anker", 14.90, 8, 80, 12),
    ("AD-USB-C-ETH", "USB-C to Ethernet Adapter", "Networking", "TP-Link", 22.00, 5, 60, 18),
    ("HUB-USB4", "4-Port USB Hub", "Accessories", "Anker", 15.00, 6, 60, 11),
    ("DOK-USBC", "USB-C Docking Station", "Accessories", "Dell", 129.00, 2, 20, 3),
    ("CHG-65W", "65W USB-C Charger", "Power", "Anker", 29.90, 6, 80, 17),
    ("CHG-100W", "100W USB-C Charger", "Power", "Anker", 59.00, 3, 30, 6),
    ("PS-CORD", "Extension Power Strip", "Power", "Belkin", 24.00, 6, 60, 4),
    ("USB-32", "USB Drive 32GB", "Storage", "Sandisk", 6.50, 15, 200, 130),
    ("USB-128", "USB Drive 128GB", "Storage", "Sandisk", 13.90, 8, 100, 24),
    ("SSD-1T", "External SSD 1TB", "Storage", "Samsung", 89.00, 4, 40, 9),
    ("HDD-2T", "External HDD 2TB", "Storage", "Samsung", 69.00, 3, 30, 6),
    ("RAM-16-DDR4", "RAM 16GB DDR4", "Spare Parts", "Kingston", 45.00, 4, 40, 12),
    ("RAM-8-DDR4", "RAM 8GB DDR4", "Spare Parts", "Kingston", 27.00, 5, 50, 26),
    ("SWH-8P", "8-Port Gigabit Switch", "Networking", "TP-Link", 34.00, 2, 20, 2),
    ("AP-WIFI6", "WiFi 6 Access Point", "Networking", "Cisco", 199.00, 1, 12, 1),
    ("PRN-TNR-BK", "Black Printer Toner", "Consumables", "HP", 79.00, 2, 30, 8),
    ("PRN-TNR-C", "Cyan Printer Toner", "Consumables", "HP", 85.00, 2, 30, 3),
    ("PRN-INK-BK", "Black Ink Cartridge", "Consumables", "HP", 22.00, 4, 40, 15),
    ("TOL-SCREWS", "Precision Screwdriver Set", "Tools", "Anker", 14.00, 3, 20, 5),
    ("TOL-CBL-TIES", "Cable Ties (pack of 100)", "Consumables", "Belkin", 7.00, 10, 100, 45),
    ("TOL-VELCRO", "Velcro Cable Wrap", "Consumables", "Belkin", 5.00, 10, 100, 30),
]


async def _ensure_named(collection: str, names_or_docs):
    id_map: dict = {}
    for entry in names_or_docs:
        if isinstance(entry, dict):
            name = entry["name"]
            existing = await db[collection].find_one({"name": name})
            if existing:
                id_map[name] = existing["id"]
                continue
            doc = dict(entry)
            doc["id"] = uid()
            doc["is_active"] = True
            doc["created_at"] = now_iso()
            await db[collection].insert_one(doc)
            id_map[name] = doc["id"]
        else:
            name = entry
            existing = await db[collection].find_one({"name": name})
            if existing:
                id_map[name] = existing["id"]
                continue
            doc = {"id": uid(), "name": name, "description": None, "is_active": True, "created_at": now_iso()}
            await db[collection].insert_one(doc)
            id_map[name] = doc["id"]
    return id_map


async def seed_all():
    # Users
    for u in [DEFAULT_ADMIN] + DEMO_USERS:
        if not await db.users.find_one({"email": u["email"]}):
            await db.users.insert_one({
                "id": uid(),
                "email": u["email"].lower(),
                "password": hash_password(u["password"]),
                "full_name": u["full_name"],
                "role": u["role"],
                "is_active": True,
                "created_at": now_iso(),
            })

    # Master data
    cat_ids = await _ensure_named("categories", CATEGORIES)
    brand_ids = await _ensure_named("brands", BRANDS)
    loc_ids = await _ensure_named("locations", LOCATIONS)
    sup_ids = await _ensure_named("suppliers", SUPPLIERS)

    # Admin user for movement attribution
    admin_user = await db.users.find_one({"email": DEFAULT_ADMIN["email"]})

    # Products
    if await db.products.count_documents({}) < len(DEMO_PRODUCTS):
        loc_keys = list(loc_ids.keys())
        sup_keys = list(sup_ids.keys())
        for sku, name, cat, brand, cost, mn, mx, initial in DEMO_PRODUCTS:
            if await db.products.find_one({"sku": sku}):
                continue
            pid = uid()
            loc = random.choice(loc_keys)
            sup = random.choice(sup_keys)
            doc = {
                "id": pid,
                "sku": sku,
                "name": name,
                "description": f"{name} — demo product",
                "category_id": cat_ids[cat],
                "brand_id": brand_ids[brand],
                "location_id": loc_ids[loc],
                "supplier_id": sup_ids[sup],
                "model": None,
                "part_number": None,
                "unit": "unit",
                "min_stock": mn,
                "max_stock": mx,
                "unit_cost": cost,
                "stock": initial,
                "barcode": sku,
                "qr_code": f"QR-{pid}",
                "is_active": True,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            }
            await db.products.insert_one(doc)
            # Initial stock as an entry movement
            if initial > 0:
                await db.inventory_movements.insert_one({
                    "id": uid(),
                    "type": "entry",
                    "product_id": pid,
                    "product_sku": sku,
                    "product_name": name,
                    "qty": initial,
                    "previous_stock": 0,
                    "resulting_stock": initial,
                    "user_id": admin_user["id"],
                    "user_name": admin_user["full_name"],
                    "reason": "initial stock (demo)",
                    "created_at": now_iso(),
                })

    # Generate some demo exits + entries in the last 14 days for a richer dashboard
    existing_mv = await db.inventory_movements.count_documents({"reason": {"$regex": "demo"}})
    if existing_mv < 15:
        products = await db.products.find({"stock": {"$gt": 0}}, {"_id": 0}).to_list(200)
        random.shuffle(products)
        now = datetime.now(timezone.utc)
        for i in range(min(30, len(products) * 2)):
            p = random.choice(products)
            days_ago = random.randint(0, 13)
            when = (now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))).isoformat()
            fresh = await db.products.find_one({"id": p["id"]})
            if not fresh:
                continue
            if random.random() < 0.6 and fresh["stock"] > 1:
                qty = random.randint(1, min(3, fresh["stock"]))
                updated = await db.products.find_one_and_update(
                    {"id": p["id"], "stock": {"$gte": qty}},
                    {"$inc": {"stock": -qty}, "$set": {"updated_at": now_iso()}},
                    return_document=True,
                )
                if updated:
                    await db.inventory_movements.insert_one({
                        "id": uid(),
                        "type": "exit",
                        "product_id": p["id"],
                        "product_sku": p["sku"],
                        "product_name": p["name"],
                        "qty": qty,
                        "previous_stock": updated["stock"] + qty,
                        "resulting_stock": updated["stock"],
                        "user_id": admin_user["id"],
                        "user_name": admin_user["full_name"],
                        "reason": random.choice(["employee request (demo)", "office rollout (demo)", "replacement (demo)"]),
                        "created_at": when,
                    })
            else:
                qty = random.randint(2, 10)
                updated = await db.products.find_one_and_update(
                    {"id": p["id"]},
                    {"$inc": {"stock": qty}, "$set": {"updated_at": now_iso()}},
                    return_document=True,
                )
                if updated:
                    await db.inventory_movements.insert_one({
                        "id": uid(),
                        "type": "entry",
                        "product_id": p["id"],
                        "product_sku": p["sku"],
                        "product_name": p["name"],
                        "qty": qty,
                        "previous_stock": updated["stock"] - qty,
                        "resulting_stock": updated["stock"],
                        "user_id": admin_user["id"],
                        "user_name": admin_user["full_name"],
                        "reason": random.choice(["restock (demo)", "purchase order (demo)"]),
                        "created_at": when,
                    })


if __name__ == "__main__":
    asyncio.run(seed_all())
    print("Seed complete.")
