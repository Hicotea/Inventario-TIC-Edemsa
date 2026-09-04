"""Pydantic models for the IT Inventory system."""
from datetime import datetime, timezone
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, EmailStr, ConfigDict
import uuid


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


Role = Literal["admin", "manager", "viewer"]
MovementType = Literal["entry", "exit", "adjustment"]
ProductStatus = Literal["available", "low", "out", "discontinued", "inactive"]


# --------- Users ---------
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    full_name: str
    role: Role = "viewer"
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6)


class UserOut(UserBase):
    id: str
    created_at: str
    updated_at: Optional[str] = None


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --------- Master data (name-based) ---------
class NamedBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    description: Optional[str] = None
    is_active: bool = True


class NamedOut(NamedBase):
    id: str
    created_at: str


class SupplierBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    tax_id: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


class SupplierOut(SupplierBase):
    id: str
    created_at: str


# --------- Products ---------
class ProductBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    sku: str
    name: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    location_id: Optional[str] = None
    supplier_id: Optional[str] = None
    model: Optional[str] = None
    part_number: Optional[str] = None
    unit: str = "unit"
    min_stock: int = 0
    max_stock: int = 1000
    unit_cost: float = 0.0
    image_url: Optional[str] = None
    barcode: Optional[str] = None
    qr_code: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    initial_stock: int = 0


class ProductUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    location_id: Optional[str] = None
    supplier_id: Optional[str] = None
    model: Optional[str] = None
    part_number: Optional[str] = None
    unit: Optional[str] = None
    min_stock: Optional[int] = None
    max_stock: Optional[int] = None
    unit_cost: Optional[float] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ProductOut(ProductBase):
    id: str
    stock: int
    status: ProductStatus
    created_at: str
    updated_at: Optional[str] = None
    # denormalized for list views
    category_name: Optional[str] = None
    brand_name: Optional[str] = None
    location_name: Optional[str] = None
    supplier_name: Optional[str] = None


# --------- Movements ---------
class MovementBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    qty: int = Field(gt=0)
    reason: Optional[str] = None
    notes: Optional[str] = None
    reference: Optional[str] = None  # doc/reference number


class EntryCreate(MovementBase):
    supplier_id: Optional[str] = None
    unit_cost: Optional[float] = None


class ExitCreate(MovementBase):
    destination: Optional[str] = None
    requester: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_document: Optional[str] = None
    department: Optional[str] = None
    serial_number: Optional[str] = None
    condition: Optional[str] = "Bueno"


class AdjustmentCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    new_stock: int = Field(ge=0)
    reason: str = Field(min_length=3)
    notes: Optional[str] = None


class MovementOut(BaseModel):
    id: str
    type: MovementType
    product_id: str
    product_sku: str
    product_name: str
    qty: int
    previous_stock: int
    resulting_stock: int
    user_id: str
    user_name: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    reference: Optional[str] = None
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    destination: Optional[str] = None
    requester: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_document: Optional[str] = None
    department: Optional[str] = None
    serial_number: Optional[str] = None
    condition: Optional[str] = None
    placa: Optional[str] = None
    device_name: Optional[str] = None
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    unit_cost: Optional[float] = None
    created_at: str


# --------- Audit ---------
class AuditOut(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    action: str
    entity: str
    entity_id: Optional[str] = None
    details: Optional[dict] = None
    created_at: str


# --------- Alerts / dashboard ---------
class AlertOut(BaseModel):
    id: str
    kind: str  # low_stock | out_of_stock | missing_code | no_movement
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    message: str
    severity: Literal["info", "warn", "error"]
    created_at: str


# --------- Stock counts (physical inventory) ---------
class CountCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    location_id: Optional[str] = None
    notes: Optional[str] = None


class CountItemPayload(BaseModel):
    product_id: str
    counted_qty: int = Field(ge=0)


class CountOut(BaseModel):
    id: str
    name: str
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    status: Literal["open", "closed"]
    created_by: str
    created_by_name: Optional[str] = None
    created_at: str
    closed_at: Optional[str] = None
    items: List[dict] = []

    