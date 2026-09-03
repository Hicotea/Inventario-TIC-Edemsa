"""MongoDB client and index management."""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

# Pasar el certificado CA explícito
client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
db = client.it_inventory
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "it_inventory")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def ensure_indexes():
    """Create indexes for performance and integrity."""
    # Users
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)

    # Products
    await db.products.create_index("id", unique=True)
    await db.products.create_index("sku", unique=True)
    await db.products.create_index("barcode", unique=True, sparse=True)
    await db.products.create_index("qr_code", unique=True, sparse=True)
    await db.products.create_index(
        [("name", "text"), ("description", "text"), ("sku", "text"), ("brand", "text"), ("model", "text")]
    )
    await db.products.create_index("category_id")
    await db.products.create_index("location_id")
    await db.products.create_index("supplier_id")
    await db.products.create_index("is_active")

    # Movements
    await db.inventory_movements.create_index("id", unique=True)
    await db.inventory_movements.create_index("product_id")
    await db.inventory_movements.create_index("user_id")
    await db.inventory_movements.create_index("type")
    await db.inventory_movements.create_index("created_at")

    # Master data
    for col in ["categories", "brands", "suppliers", "locations"]:
        await db[col].create_index("id", unique=True)
        await db[col].create_index("name")

    # Audit
    await db.audit_logs.create_index("id", unique=True)
    await db.audit_logs.create_index("created_at")
    await db.audit_logs.create_index("user_id")
    await db.audit_logs.create_index("entity")

    # Stock counts
    await db.stock_counts.create_index("id", unique=True)
    await db.stock_counts.create_index("created_at")

    # Permissions
    await db.role_permissions.create_index("role", unique=True)