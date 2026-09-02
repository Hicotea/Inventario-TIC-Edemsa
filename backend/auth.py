"""Authentication helpers: JWT, bcrypt, FastAPI deps for RBAC."""
import os
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from database import db

# Persistent server-side secret; generated once if missing.
JWT_SECRET = os.environ.get("JWT_SECRET") or "it-inventory-secret-" + secrets.token_hex(32)
JWT_ALGO = "HS256"
JWT_TTL_MIN = int(os.environ.get("JWT_TTL_MIN", "480"))  # 8 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_TTL_MIN),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado.")
    try:
        data = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="La sesión expiró. Inicie sesión nuevamente.")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas.")

    user = await db.users.find_one({"id": data["sub"]}, {"_id": 0, "password": 0})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inactivo o inexistente.")
    return user


# ---------- Permissions ----------
# Default per-role permission map. Overridable via db.role_permissions collection.
DEFAULT_PERMISSIONS = {
    "admin": {
        "product:read", "product:write", "product:delete",
        "movement:read", "movement:write", "adjustment:write",
        "master:read", "master:write",
        "user:read", "user:write",
        "audit:read",
        "report:read",
        "import:write",
        "count:read", "count:write",
        "settings:write",
    },
    "manager": {
        "product:read", "product:write",
        "movement:read", "movement:write",
        "master:read",
        "report:read",
        "count:read", "count:write",
    },
    "viewer": {
        "product:read",
        "movement:read",
        "master:read",
        "report:read",
    },
}


async def get_permissions_for_role(role: str) -> set:
    doc = await db.role_permissions.find_one({"role": role}, {"_id": 0})
    if doc and isinstance(doc.get("permissions"), list):
        return set(doc["permissions"])
    return set(DEFAULT_PERMISSIONS.get(role, set()))


def require_perm(*needed: str):
    async def _dep(user: dict = Depends(get_current_user)):
        perms = await get_permissions_for_role(user["role"])
        if user["role"] == "admin":
            return user  # admins always allowed
        for p in needed:
            if p not in perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No tiene permisos para realizar esta acción ({p}).",
                )
        return user

    return _dep


def require_role(*roles: str):
    async def _dep(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requieren permisos de administrador.")
        return user

    return _dep
