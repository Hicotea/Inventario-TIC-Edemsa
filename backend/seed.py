"""Seed initial admin user ONLY.
Idempotent: safe to run multiple times.
"""
import asyncio
from database import db
from auth import hash_password
from utils import uid, now_iso

DEFAULT_ADMIN = {
    "email": "admin@company.com",
    "password": "Admin123!",
    "full_name": "System Administrator",
    "role": "admin",
}

async def seed_all():
    # Crear ÚNICAMENTE el usuario Administrador si no existe
    if not await db.users.find_one({"email": DEFAULT_ADMIN["email"]}):
        await db.users.insert_one({
            "id": uid(),
            "email": DEFAULT_ADMIN["email"].lower(),
            "password": hash_password(DEFAULT_ADMIN["password"]),
            "full_name": DEFAULT_ADMIN["full_name"],
            "role": DEFAULT_ADMIN["role"],
            "is_active": True,
            "created_at": now_iso(),
        })

if __name__ == "__main__":
    asyncio.run(seed_all())
    print("Seed complete: Only admin user verified.")