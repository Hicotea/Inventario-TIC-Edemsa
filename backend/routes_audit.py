"""Audit log routes (read-only for admins)."""
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from database import db
from models import AuditOut
from auth import require_perm

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=List[AuditOut])
async def list_audit(
    user: dict = Depends(require_perm("audit:read")),
    q: Optional[str] = None,
    entity: Optional[str] = None,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(300, le=2000),
    skip: int = 0,
):
    query: dict = {}
    if entity:
        query["entity"] = entity
    if user_id:
        query["user_id"] = user_id
    if action:
        query["action"] = {"$regex": action, "$options": "i"}
    if q:
        query["$or"] = [
            {"action": {"$regex": q, "$options": "i"}},
            {"entity": {"$regex": q, "$options": "i"}},
            {"user_name": {"$regex": q, "$options": "i"}},
        ]
    if date_from or date_to:
        query["created_at"] = {}
        if date_from:
            query["created_at"]["$gte"] = date_from
        if date_to:
            query["created_at"]["$lte"] = date_to
    docs = await db.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return docs
