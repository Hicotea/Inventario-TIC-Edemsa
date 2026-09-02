"""
POC Test Script — validates the CORE workflow of the IT Inventory system.

Validates:
1. Atomic stock decrement via find_one_and_update with conditional filter (no negative stock)
2. Concurrent exit attempts (oversell prevention)
3. Movement log integrity (every stock change traceable)
4. Product lookup by SKU / barcode / qr_code
5. QR code + barcode generation as base64 PNGs
6. bcrypt password hashing round-trip
7. JWT sign / verify round-trip

Run:  python test_core.py
"""
import asyncio
import base64
import io
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Third party libs used in the app
import bcrypt
import jwt
import qrcode
import barcode
from barcode.writer import ImageWriter

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "test_database") + "_poc"  # isolated DB for POC

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"
INFO = "\033[94mINFO\033[0m"


def _print(tag, msg):
    print(f"[{tag}] {msg}")


# ---------------------- Core business primitives ----------------------

async def create_product(sku: str, name: str, initial_stock: int, min_stock: int = 5):
    """Create a product with initial stock and codes."""
    pid = str(uuid.uuid4())
    doc = {
        "id": pid,
        "sku": sku,
        "name": name,
        "stock": initial_stock,
        "min_stock": min_stock,
        "max_stock": 1000,
        "barcode": f"BC{sku}",
        "qr_code": f"QR-{pid}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.products.insert_one(doc)
    return doc


async def register_entry(product_id: str, qty: int, user_id: str, reason: str = "purchase"):
    """
    Atomically increment stock and record movement.
    Returns (ok: bool, movement: dict|None, error: str|None)
    """
    if qty <= 0:
        return False, None, "qty must be > 0"

    updated = await db.products.find_one_and_update(
        {"id": product_id},
        {"$inc": {"stock": qty}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True,  # returns after
    )
    if not updated:
        return False, None, "product not found"

    previous_stock = updated["stock"] - qty
    movement = {
        "id": str(uuid.uuid4()),
        "type": "entry",
        "product_id": product_id,
        "product_sku": updated["sku"],
        "qty": qty,
        "previous_stock": previous_stock,
        "resulting_stock": updated["stock"],
        "user_id": user_id,
        "reason": reason,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.inventory_movements.insert_one(movement)
    return True, movement, None


async def register_exit(product_id: str, qty: int, user_id: str, reason: str = "consumption"):
    """
    Atomically decrement stock ONLY if enough is available; record movement.
    Uses a conditional filter to guarantee no negative stock even under concurrency.
    Returns (ok: bool, movement: dict|None, error: str|None)
    """
    if qty <= 0:
        return False, None, "qty must be > 0"

    # Conditional atomic update — decrements only if stock >= qty
    updated = await db.products.find_one_and_update(
        {"id": product_id, "stock": {"$gte": qty}},
        {"$inc": {"stock": -qty}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True,
    )
    if not updated:
        # Either product doesn't exist or insufficient stock
        exists = await db.products.find_one({"id": product_id})
        if not exists:
            return False, None, "product not found"
        return False, None, f"insufficient stock (have {exists['stock']}, need {qty})"

    previous_stock = updated["stock"] + qty
    movement = {
        "id": str(uuid.uuid4()),
        "type": "exit",
        "product_id": product_id,
        "product_sku": updated["sku"],
        "qty": qty,
        "previous_stock": previous_stock,
        "resulting_stock": updated["stock"],
        "user_id": user_id,
        "reason": reason,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.inventory_movements.insert_one(movement)
    return True, movement, None


async def lookup_by_code(code: str):
    """Find product by sku / barcode / qr_code (scanner support)."""
    return await db.products.find_one(
        {"$or": [{"sku": code}, {"barcode": code}, {"qr_code": code}]}, {"_id": 0}
    )


# ---------------------- Codes generation ----------------------

def gen_qr_base64(payload: str) -> str:
    """Generate QR PNG as base64 (returns 'data:image/png;base64,....')."""
    img = qrcode.make(payload)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def gen_barcode_base64(payload: str) -> str:
    """Generate Code128 barcode PNG as base64."""
    code = barcode.get("code128", payload, writer=ImageWriter())
    buf = io.BytesIO()
    code.write(buf, options={"write_text": False})
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# ---------------------- Auth primitives ----------------------

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


def make_jwt(user_id: str, role: str, secret: str = "poc-secret", exp_min: int = 60) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=exp_min),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def read_jwt(token: str, secret: str = "poc-secret") -> dict:
    return jwt.decode(token, secret, algorithms=["HS256"])


# ---------------------- Tests ----------------------

async def cleanup():
    await db.products.delete_many({})
    await db.inventory_movements.delete_many({})


async def test_create_and_lookup():
    _print(INFO, "Test 1: create product and lookup by sku/barcode/qr_code")
    p = await create_product(sku="KB-001", name="USB Keyboard", initial_stock=20)
    for code in [p["sku"], p["barcode"], p["qr_code"]]:
        found = await lookup_by_code(code)
        assert found and found["id"] == p["id"], f"lookup failed for {code}"
    _print(PASS, f"  product {p['sku']} findable by sku, barcode, qr_code")
    return p


async def test_entry_flow(p):
    _print(INFO, "Test 2: register entry increments stock and logs movement")
    ok, mv, err = await register_entry(p["id"], 15, "user-admin", "purchase")
    assert ok and mv, f"entry failed: {err}"
    fresh = await db.products.find_one({"id": p["id"]}, {"_id": 0})
    assert fresh["stock"] == 35, f"expected 35, got {fresh['stock']}"
    assert mv["previous_stock"] == 20 and mv["resulting_stock"] == 35
    _print(PASS, f"  stock 20 -> 35, movement id={mv['id'][:8]}")


async def test_exit_flow(p):
    _print(INFO, "Test 3: register exit decrements stock and logs movement")
    ok, mv, err = await register_exit(p["id"], 5, "user-mgr", "consumption")
    assert ok, f"exit failed: {err}"
    fresh = await db.products.find_one({"id": p["id"]})
    assert fresh["stock"] == 30, f"expected 30, got {fresh['stock']}"
    assert mv["previous_stock"] == 35 and mv["resulting_stock"] == 30
    _print(PASS, f"  stock 35 -> 30")


async def test_exit_insufficient(p):
    _print(INFO, "Test 4: exit fails when qty > available stock")
    ok, mv, err = await register_exit(p["id"], 9999, "user-mgr", "consumption")
    assert not ok, "exit should have failed"
    assert "insufficient stock" in (err or "").lower(), err
    fresh = await db.products.find_one({"id": p["id"]})
    assert fresh["stock"] == 30, f"stock changed unexpectedly to {fresh['stock']}"
    _print(PASS, f"  correctly blocked; stock unchanged at 30; err='{err}'")


async def test_concurrent_oversell():
    _print(INFO, "Test 5: 30 concurrent exits of qty=1 on stock=10 → exactly 10 succeed, stock=0")
    p = await create_product(sku="CONC-001", name="Concurrency Test", initial_stock=10)
    tasks = [register_exit(p["id"], 1, f"user-{i}") for i in range(30)]
    results = await asyncio.gather(*tasks)
    successes = [r for r in results if r[0]]
    failures = [r for r in results if not r[0]]
    fresh = await db.products.find_one({"id": p["id"]})
    movements = await db.inventory_movements.count_documents({"product_id": p["id"], "type": "exit"})
    assert len(successes) == 10, f"expected 10 successes, got {len(successes)}"
    assert len(failures) == 20, f"expected 20 failures, got {len(failures)}"
    assert fresh["stock"] == 0, f"expected 0, got {fresh['stock']}"
    assert movements == 10, f"expected 10 exit movements, got {movements}"
    _print(PASS, f"  10 succeeded, 20 blocked, stock=0, movements=10")


async def test_negative_qty_rejected():
    _print(INFO, "Test 6: negative / zero qty rejected on entry and exit")
    p = await create_product(sku="NEG-001", name="Neg Test", initial_stock=5)
    for qty in [0, -3, -1000]:
        ok, _, err = await register_entry(p["id"], qty, "u1")
        assert not ok, f"entry with qty={qty} should fail"
        ok, _, err = await register_exit(p["id"], qty, "u1")
        assert not ok, f"exit with qty={qty} should fail"
    _print(PASS, "  0 and negative quantities rejected on both entry and exit")


def test_code_generation():
    _print(INFO, "Test 7: QR + barcode generation returns valid base64 PNG")
    qr = gen_qr_base64("QR-abc-123")
    bc = gen_barcode_base64("SKU-KB-001")
    assert qr.startswith("data:image/png;base64,") and len(qr) > 200
    assert bc.startswith("data:image/png;base64,") and len(bc) > 200
    # Also confirm raw bytes decode
    raw_qr = base64.b64decode(qr.split(",", 1)[1])
    raw_bc = base64.b64decode(bc.split(",", 1)[1])
    assert raw_qr[:8] == b"\x89PNG\r\n\x1a\n"
    assert raw_bc[:8] == b"\x89PNG\r\n\x1a\n"
    _print(PASS, f"  QR ({len(qr)} chars) and Barcode ({len(bc)} chars) generated as valid PNGs")


def test_password_hashing():
    _print(INFO, "Test 8: bcrypt hash + verify")
    pw = "Admin123!"
    h = hash_password(pw)
    assert verify_password(pw, h)
    assert not verify_password("wrong", h)
    _print(PASS, "  bcrypt hash/verify works correctly")


def test_jwt_roundtrip():
    _print(INFO, "Test 9: JWT sign + decode")
    tok = make_jwt("user-1", "admin")
    decoded = read_jwt(tok)
    assert decoded["sub"] == "user-1" and decoded["role"] == "admin"
    _print(PASS, f"  JWT roundtrip ok (token len {len(tok)})")


async def test_indexes():
    _print(INFO, "Test 10: unique indexes prevent duplicate sku/barcode/qr")
    # Create indexes (mimicking what backend startup will do)
    await db.products.create_index("sku", unique=True)
    await db.products.create_index("barcode", unique=True, sparse=True)
    await db.products.create_index("qr_code", unique=True, sparse=True)
    await create_product(sku="UNIQ-001", name="A", initial_stock=1)
    dup_err = None
    try:
        await create_product(sku="UNIQ-001", name="B", initial_stock=1)
    except Exception as e:
        dup_err = str(e)
    assert dup_err and "duplicate" in dup_err.lower(), f"expected duplicate error, got {dup_err}"
    _print(PASS, "  duplicate sku correctly rejected by unique index")


async def main():
    print(f"\n{'='*70}\nIT INVENTORY POC — CORE WORKFLOW VALIDATION\n{'='*70}")
    print(f"MongoDB: {MONGO_URL}")
    print(f"DB:      {DB_NAME}\n")
    try:
        await cleanup()
        p = await test_create_and_lookup()
        await test_entry_flow(p)
        await test_exit_flow(p)
        await test_exit_insufficient(p)
        await test_concurrent_oversell()
        await test_negative_qty_rejected()
        test_code_generation()
        test_password_hashing()
        test_jwt_roundtrip()
        await test_indexes()
        print(f"\n{'='*70}\nALL CORE TESTS PASSED ✅\n{'='*70}\n")
        print("Cleaning up POC db...")
        await client.drop_database(DB_NAME)
        return 0
    except AssertionError as e:
        print(f"\n{FAIL}: {e}")
        import traceback
        traceback.print_exc()
        return 1
    except Exception as e:
        print(f"\n{FAIL} (unexpected): {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
