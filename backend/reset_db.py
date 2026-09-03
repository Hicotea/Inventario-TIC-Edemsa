import asyncio
import os
from pathlib import Path
import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Cargar variables de entorno
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "it_inventory")

client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
db = client[DB_NAME]

async def clear_test_data():
    # Colecciones de datos de prueba a eliminar
    collections_to_clear = [
        "products",
        "inventory_movements",
        "locations",    # Bodegas / Ubicaciones
        "categories",
        "brands",
        "suppliers",
        "audit_logs",
        "stock_counts"
    ]

    print("Iniciando limpieza de datos de prueba...")
    for collection in collections_to_clear:
        result = await db[collection].delete_many({})
        print(f"✓ Eliminados {result.deleted_count} documentos de '{collection}'")

    print("\n¡Limpieza completada! Los usuarios y permisos no sufrieron cambios.")

if __name__ == "__main__":
    asyncio.run(clear_test_data())