"""User CRUD routes (admin only)."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from database import db
from models import UserCreate, UserUpdate, UserOut
from auth import hash_password, require_role
from utils import uid, now_iso, sanitize, write_audit

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserOut])
async def list_users(user: dict = Depends(require_role("admin"))):
    docs = await db.users.find({}, {"_id": 0, "password": 0}).sort("created_at", 1).to_list(1000)
    return docs


@router.post("", response_model=UserOut, status_code=201)
async def create_user(payload: UserCreate, user: dict = Depends(require_role("admin"))):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, detail="A user with this email already exists.")
    doc = payload.model_dump()
    doc["email"] = email
    doc["password"] = hash_password(payload.password)
    doc["id"] = uid()
    doc["created_at"] = now_iso()
    await db.users.insert_one(doc)
    await write_audit(user, "user.create", "user", doc["id"], {"email": email, "role": payload.role})
    return sanitize(doc)


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate, user: dict = Depends(require_role("admin"))):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "password" in updates:
        updates["password"] = hash_password(updates["password"])
    updates["updated_at"] = now_iso()
    result = await db.users.find_one_and_update({"id": user_id}, {"$set": updates}, return_document=True)
    if not result:
        raise HTTPException(404, detail="User not found.")
    await write_audit(user, "user.update", "user", user_id, {k: v for k, v in updates.items() if k != "password"})
    return sanitize(result)


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str, user: dict = Depends(require_role("admin"))):
    if user_id == user["id"]:
        raise HTTPException(400, detail="You cannot delete your own account.")
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(404, detail="User not found.")
    await write_audit(user, "user.delete", "user", user_id)
    return
