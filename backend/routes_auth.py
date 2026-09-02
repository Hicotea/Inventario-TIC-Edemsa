"""Authentication routes: login, me."""
from fastapi import APIRouter, Depends, HTTPException, status
from database import db
from models import LoginPayload, TokenOut, UserOut
from auth import verify_password, create_token, get_current_user, get_permissions_for_role
from utils import sanitize, write_audit

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
async def login(payload: LoginPayload):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user.get("password", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña inválidos.")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada. Contacte a un administrador.")
    token = create_token(user["id"], user["role"])
    clean = sanitize(user)
    await write_audit(clean, "login", "auth", user["id"])
    return {"access_token": token, "token_type": "bearer", "user": clean}


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return user


@router.get("/permissions")
async def my_permissions(user: dict = Depends(get_current_user)):
    perms = await get_permissions_for_role(user["role"])
    return {"role": user["role"], "permissions": sorted(perms), "is_admin": user["role"] == "admin"}
