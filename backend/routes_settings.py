"""Settings: role-permission matrix (admin only)."""
from fastapi import APIRouter, Depends, HTTPException
from database import db
from auth import require_role, DEFAULT_PERMISSIONS
from utils import write_audit

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/permissions")
async def get_permissions(user: dict = Depends(require_role("admin"))):
    # Merge stored overrides with defaults
    result: dict = {}
    for role, perms in DEFAULT_PERMISSIONS.items():
        stored = await db.role_permissions.find_one({"role": role}, {"_id": 0})
        result[role] = sorted(stored["permissions"] if stored else list(perms))
    all_perms = sorted({p for perms in DEFAULT_PERMISSIONS.values() for p in perms})
    return {"roles": result, "all_permissions": all_perms}


@router.put("/permissions/{role}")
async def set_permissions(role: str, payload: dict, user: dict = Depends(require_role("admin"))):
    if role not in DEFAULT_PERMISSIONS:
        raise HTTPException(400, detail="Unknown role.")
    perms = payload.get("permissions")
    if not isinstance(perms, list):
        raise HTTPException(400, detail="permissions must be a list of strings.")
    await db.role_permissions.update_one(
        {"role": role},
        {"$set": {"role": role, "permissions": sorted(set(perms))}},
        upsert=True,
    )
    await write_audit(user, "settings.permissions.update", "role_permissions", role, {"permissions": sorted(set(perms))})
    return {"role": role, "permissions": sorted(set(perms))}
