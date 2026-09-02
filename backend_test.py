"""
Comprehensive Backend Test Suite for IT Inventory Management System (Stockroom OS)

Tests all endpoints, RBAC, atomic stock operations, concurrent oversell protection,
and all CRUD operations for products, movements, master data, users, etc.
"""
import asyncio
import requests  # pyright: ignore[reportMissingModuleSource]
import sys
import time
from datetime import datetime
from typing import Optional, Dict, List, Tuple
from concurrent.futures import ThreadPoolExecutor

# Base URL from frontend/.env
BASE_URL = "REACT_APP_API_URL=http://localhost:8000/api"

# Test credentials (seeded)
ADMIN_EMAIL = "admin@company.com"
ADMIN_PASSWORD = "Admin123!"
MANAGER_EMAIL = "manager@company.com"
MANAGER_PASSWORD = "Manager123!"
VIEWER_EMAIL = "viewer@company.com"
VIEWER_PASSWORD = "Viewer123!"


class TestResult:
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def add_pass(self, test_name: str):
        self.total += 1
        self.passed += 1
        print(f"✅ PASS: {test_name}")

    def add_fail(self, test_name: str, reason: str):
        self.total += 1
        self.failed += 1
        error_msg = f"❌ FAIL: {test_name} - {reason}"
        print(error_msg)
        self.errors.append(error_msg)

    def add_warning(self, msg: str):
        warning_msg = f"⚠️  WARNING: {msg}"
        print(warning_msg)
        self.warnings.append(warning_msg)

    def summary(self):
        print("\n" + "=" * 80)
        print(f"TEST SUMMARY: {self.passed}/{self.total} passed, {self.failed} failed")
        print("=" * 80)
        if self.errors:
            print("\n❌ FAILED TESTS:")
            for err in self.errors:
                print(f"  {err}")
        if self.warnings:
            print("\n⚠️  WARNINGS:")
            for warn in self.warnings:
                print(f"  {warn}")
        return self.failed == 0


class APIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.user: Optional[Dict] = None

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def login(self, email: str, password: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """Login and store token. Returns (success, user, error)"""
        try:
            resp = requests.post(
                f"{self.base_url}/auth/login",
                json={"email": email, "password": password},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                self.token = data.get("access_token")
                self.user = data.get("user")
                return True, self.user, None
            else:
                return False, None, f"Status {resp.status_code}: {resp.text}"
        except Exception as e:
            return False, None, str(e)

    def get(self, endpoint: str, params: Optional[Dict] = None) -> requests.Response:
        url = f"{self.base_url}{endpoint}"
        return requests.get(url, headers=self._headers(), params=params, timeout=10)

    def post(self, endpoint: str, data: Optional[Dict] = None) -> requests.Response:
        url = f"{self.base_url}{endpoint}"
        return requests.post(url, json=data, headers=self._headers(), timeout=10)

    def patch(self, endpoint: str, data: Optional[Dict] = None) -> requests.Response:
        url = f"{self.base_url}{endpoint}"
        return requests.patch(url, json=data, headers=self._headers(), timeout=10)

    def delete(self, endpoint: str) -> requests.Response:
        url = f"{self.base_url}{endpoint}"
        return requests.delete(url, headers=self._headers(), timeout=10)


def test_health(result: TestResult):
    """Test server health endpoint"""
    print("\n" + "=" * 80)
    print("1. HEALTH CHECK")
    print("=" * 80)
    try:
        resp = requests.get(f"{BASE_URL}/", timeout=10)
        if resp.status_code == 200 and "status" in resp.json():
            result.add_pass("Server health check")
        else:
            result.add_fail("Server health check", f"Status {resp.status_code}")
    except Exception as e:
        result.add_fail("Server health check", str(e))


def test_auth(result: TestResult) -> Tuple[APIClient, APIClient, APIClient]:
    """Test authentication for all three roles"""
    print("\n" + "=" * 80)
    print("2. AUTHENTICATION")
    print("=" * 80)

    admin_client = APIClient(BASE_URL)
    manager_client = APIClient(BASE_URL)
    viewer_client = APIClient(BASE_URL)

    # Test admin login
    success, user, error = admin_client.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if success and user and user.get("role") == "admin":
        result.add_pass(f"Admin login ({ADMIN_EMAIL})")
    else:
        result.add_fail(f"Admin login ({ADMIN_EMAIL})", error or "Invalid response")

    # Test manager login
    success, user, error = manager_client.login(MANAGER_EMAIL, MANAGER_PASSWORD)
    if success and user and user.get("role") == "manager":
        result.add_pass(f"Manager login ({MANAGER_EMAIL})")
    else:
        result.add_fail(f"Manager login ({MANAGER_EMAIL})", error or "Invalid response")

    # Test viewer login
    success, user, error = viewer_client.login(VIEWER_EMAIL, VIEWER_PASSWORD)
    if success and user and user.get("role") == "viewer":
        result.add_pass(f"Viewer login ({VIEWER_EMAIL})")
    else:
        result.add_fail(f"Viewer login ({VIEWER_EMAIL})", error or "Invalid response")

    # Test /auth/me endpoint
    if admin_client.token:
        resp = admin_client.get("/auth/me")
        if resp.status_code == 200 and resp.json().get("email") == ADMIN_EMAIL:
            result.add_pass("GET /auth/me returns current user")
        else:
            result.add_fail("GET /auth/me", f"Status {resp.status_code}")

    # Test invalid credentials
    bad_client = APIClient(BASE_URL)
    success, _, _ = bad_client.login("bad@email.com", "wrongpass")
    if not success:
        result.add_pass("Invalid credentials rejected")
    else:
        result.add_fail("Invalid credentials rejected", "Should have failed")

    return admin_client, manager_client, viewer_client


def test_master_data(admin: APIClient, manager: APIClient, viewer: APIClient, result: TestResult) -> Dict[str, str]:
    """Test master data CRUD (categories, brands, locations, suppliers)"""
    print("\n" + "=" * 80)
    print("3. MASTER DATA CRUD")
    print("=" * 80)

    master_ids = {}

    # Test categories
    resp = admin.post("/categories", {"name": f"Test Category {int(time.time())}", "description": "Test"})
    if resp.status_code == 201:
        cat_id = resp.json().get("id")
        master_ids["category_id"] = cat_id
        result.add_pass("POST /categories (admin)")
    else:
        result.add_fail("POST /categories (admin)", f"Status {resp.status_code}: {resp.text}")

    resp = admin.get("/categories")
    if resp.status_code == 200 and isinstance(resp.json(), list):
        result.add_pass("GET /categories")
    else:
        result.add_fail("GET /categories", f"Status {resp.status_code}")

    # Test brands
    resp = admin.post("/brands", {"name": f"Test Brand {int(time.time())}", "description": "Test"})
    if resp.status_code == 201:
        brand_id = resp.json().get("id")
        master_ids["brand_id"] = brand_id
        result.add_pass("POST /brands (admin)")
    else:
        result.add_fail("POST /brands (admin)", f"Status {resp.status_code}: {resp.text}")

    resp = admin.get("/brands")
    if resp.status_code == 200 and isinstance(resp.json(), list):
        result.add_pass("GET /brands")
    else:
        result.add_fail("GET /brands", f"Status {resp.status_code}")

    # Test locations
    resp = admin.post("/locations", {"name": f"Test Location {int(time.time())}", "description": "Test"})
    if resp.status_code == 201:
        loc_id = resp.json().get("id")
        master_ids["location_id"] = loc_id
        result.add_pass("POST /locations (admin)")
    else:
        result.add_fail("POST /locations (admin)", f"Status {resp.status_code}: {resp.text}")

    resp = admin.get("/locations")
    if resp.status_code == 200 and isinstance(resp.json(), list):
        result.add_pass("GET /locations")
    else:
        result.add_fail("GET /locations", f"Status {resp.status_code}")

    # Test suppliers
    resp = admin.post("/suppliers", {
        "name": f"Test Supplier {int(time.time())}",
        "contact_name": "John Doe",
        "email": "supplier@test.com"
    })
    if resp.status_code == 201:
        sup_id = resp.json().get("id")
        master_ids["supplier_id"] = sup_id
        result.add_pass("POST /suppliers (admin)")
    else:
        result.add_fail("POST /suppliers (admin)", f"Status {resp.status_code}: {resp.text}")

    resp = admin.get("/suppliers")
    if resp.status_code == 200 and isinstance(resp.json(), list):
        result.add_pass("GET /suppliers")
    else:
        result.add_fail("GET /suppliers", f"Status {resp.status_code}")

    # Test RBAC: Viewer cannot create master data
    resp = viewer.post("/categories", {"name": "Viewer Test", "description": "Should fail"})
    if resp.status_code == 403:
        result.add_pass("RBAC: Viewer cannot POST /categories (403)")
    else:
        result.add_fail("RBAC: Viewer cannot POST /categories", f"Expected 403, got {resp.status_code}")

    return master_ids


def test_products(admin: APIClient, manager: APIClient, viewer: APIClient, master_ids: Dict, result: TestResult) -> str:
    """Test product CRUD operations"""
    print("\n" + "=" * 80)
    print("4. PRODUCTS CRUD")
    print("=" * 80)

    product_id = None
    sku = f"TEST-SKU-{int(time.time())}"

    # Create product (admin)
    payload = {
        "sku": sku,
        "name": "Test Product",
        "description": "Test description",
        "category_id": master_ids.get("category_id"),
        "brand_id": master_ids.get("brand_id"),
        "location_id": master_ids.get("location_id"),
        "supplier_id": master_ids.get("supplier_id"),
        "unit": "unit",
        "min_stock": 5,
        "max_stock": 100,
        "unit_cost": 10.50,
        "initial_stock": 50
    }
    resp = admin.post("/products", payload)
    if resp.status_code == 201:
        product_id = resp.json().get("id")
        result.add_pass("POST /products (admin)")
    else:
        result.add_fail("POST /products (admin)", f"Status {resp.status_code}: {resp.text}")
        return None

    # Test unique SKU enforcement
    resp = admin.post("/products", payload)
    if resp.status_code == 400:
        result.add_pass("Unique SKU enforcement (duplicate rejected)")
    else:
        result.add_fail("Unique SKU enforcement", f"Expected 400, got {resp.status_code}")

    # Get product by ID
    resp = admin.get(f"/products/{product_id}")
    if resp.status_code == 200:
        p = resp.json()
        if p.get("sku") == sku and p.get("stock") == 50:
            result.add_pass(f"GET /products/{product_id}")
        else:
            result.add_fail(f"GET /products/{product_id}", f"Data mismatch: {p}")
    else:
        result.add_fail(f"GET /products/{product_id}", f"Status {resp.status_code}")

    # List products with filters
    resp = admin.get("/products", params={"q": sku})
    if resp.status_code == 200 and len(resp.json()) > 0:
        result.add_pass("GET /products with search filter")
    else:
        result.add_fail("GET /products with search", f"Status {resp.status_code}")

    # Update product (manager can update)
    resp = manager.patch(f"/products/{product_id}", {"name": "Updated Product Name"})
    if resp.status_code == 200:
        result.add_pass("PATCH /products (manager)")
    else:
        result.add_fail("PATCH /products (manager)", f"Status {resp.status_code}")

    # Test QR/barcode codes endpoint
    resp = admin.get(f"/products/{product_id}/codes")
    if resp.status_code == 200:
        codes = resp.json()
        if "qr_code" in codes and "barcode" in codes and "qr_png" in codes:
            result.add_pass("GET /products/{id}/codes returns QR/barcode")
        else:
            result.add_fail("GET /products/{id}/codes", f"Missing fields: {codes}")
    else:
        result.add_fail("GET /products/{id}/codes", f"Status {resp.status_code}")

    # Test scan lookup
    resp = admin.get("/scan/lookup", params={"code": sku})
    if resp.status_code == 200 and resp.json().get("id") == product_id:
        result.add_pass("GET /scan/lookup by SKU")
    else:
        result.add_fail("GET /scan/lookup", f"Status {resp.status_code}")

    # Test RBAC: Viewer cannot update products
    resp = viewer.patch(f"/products/{product_id}", {"name": "Viewer Update"})
    if resp.status_code == 403:
        result.add_pass("RBAC: Viewer cannot PATCH /products (403)")
    else:
        result.add_fail("RBAC: Viewer cannot PATCH /products", f"Expected 403, got {resp.status_code}")

    # Test RBAC: Viewer cannot delete products
    resp = viewer.delete(f"/products/{product_id}")
    if resp.status_code == 403:
        result.add_pass("RBAC: Viewer cannot DELETE /products (403)")
    else:
        result.add_fail("RBAC: Viewer cannot DELETE /products", f"Expected 403, got {resp.status_code}")

    return product_id


def test_movements(admin: APIClient, manager: APIClient, viewer: APIClient, product_id: str, result: TestResult):
    """Test inventory movements: entry, exit, adjustment"""
    print("\n" + "=" * 80)
    print("5. INVENTORY MOVEMENTS")
    print("=" * 80)

    # Get current stock
    resp = admin.get(f"/products/{product_id}")
    if resp.status_code != 200:
        result.add_fail("Get product for movements test", f"Status {resp.status_code}")
        return
    initial_stock = resp.json().get("stock", 0)

    # Test entry (manager can create)
    resp = manager.post("/movements/entry", {
        "product_id": product_id,
        "qty": 10,
        "reason": "purchase",
        "notes": "Test entry"
    })
    if resp.status_code == 201:
        mv = resp.json()
        if mv.get("type") == "entry" and mv.get("qty") == 10:
            result.add_pass("POST /movements/entry increases stock")
        else:
            result.add_fail("POST /movements/entry", f"Data mismatch: {mv}")
    else:
        result.add_fail("POST /movements/entry", f"Status {resp.status_code}: {resp.text}")

    # Verify stock increased
    resp = admin.get(f"/products/{product_id}")
    new_stock = resp.json().get("stock", 0)
    if new_stock == initial_stock + 10:
        result.add_pass("Stock increased atomically after entry")
    else:
        result.add_fail("Stock increase verification", f"Expected {initial_stock + 10}, got {new_stock}")

    # Test exit (valid)
    resp = manager.post("/movements/exit", {
        "product_id": product_id,
        "qty": 5,
        "reason": "consumption",
        "destination": "IT Dept"
    })
    if resp.status_code == 201:
        mv = resp.json()
        if mv.get("type") == "exit" and mv.get("qty") == 5:
            result.add_pass("POST /movements/exit decreases stock")
        else:
            result.add_fail("POST /movements/exit", f"Data mismatch: {mv}")
    else:
        result.add_fail("POST /movements/exit", f"Status {resp.status_code}: {resp.text}")

    # Verify stock decreased
    resp = admin.get(f"/products/{product_id}")
    current_stock = resp.json().get("stock", 0)
    expected_stock = initial_stock + 10 - 5
    if current_stock == expected_stock:
        result.add_pass("Stock decreased atomically after exit")
    else:
        result.add_fail("Stock decrease verification", f"Expected {expected_stock}, got {current_stock}")

    # Test oversell protection (exit more than available)
    resp = manager.post("/movements/exit", {
        "product_id": product_id,
        "qty": current_stock + 100,  # More than available
        "reason": "oversell test"
    })
    if resp.status_code == 400:
        result.add_pass("Oversell protection: exit > stock returns 400")
    else:
        result.add_fail("Oversell protection", f"Expected 400, got {resp.status_code}")

    # Verify stock unchanged after failed oversell
    resp = admin.get(f"/products/{product_id}")
    stock_after_oversell = resp.json().get("stock", 0)
    if stock_after_oversell == current_stock:
        result.add_pass("Stock unchanged after failed oversell attempt")
    else:
        result.add_fail("Stock unchanged verification", f"Stock changed from {current_stock} to {stock_after_oversell}")

    # Test adjustment
    resp = admin.post("/movements/adjustment", {
        "product_id": product_id,
        "new_stock": 100,
        "reason": "Physical count adjustment"
    })
    if resp.status_code == 201:
        mv = resp.json()
        if mv.get("type") == "adjustment":
            result.add_pass("POST /movements/adjustment sets stock")
        else:
            result.add_fail("POST /movements/adjustment", f"Data mismatch: {mv}")
    else:
        result.add_fail("POST /movements/adjustment", f"Status {resp.status_code}: {resp.text}")

    # Verify adjustment
    resp = admin.get(f"/products/{product_id}")
    if resp.json().get("stock") == 100:
        result.add_pass("Stock set correctly after adjustment")
    else:
        result.add_fail("Adjustment verification", f"Expected 100, got {resp.json().get('stock')}")

    # Test list movements with filters
    resp = admin.get("/movements", params={"product_id": product_id})
    if resp.status_code == 200 and len(resp.json()) >= 3:  # entry, exit, adjustment
        result.add_pass("GET /movements with filters")
    else:
        result.add_fail("GET /movements", f"Status {resp.status_code} or insufficient movements")

    # Test RBAC: Viewer cannot create movements
    resp = viewer.post("/movements/entry", {"product_id": product_id, "qty": 1, "reason": "test"})
    if resp.status_code == 403:
        result.add_pass("RBAC: Viewer cannot POST /movements/entry (403)")
    else:
        result.add_fail("RBAC: Viewer cannot POST /movements/entry", f"Expected 403, got {resp.status_code}")


def test_concurrent_oversell(admin: APIClient, result: TestResult):
    """Test concurrent exit attempts to verify atomic stock operations"""
    print("\n" + "=" * 80)
    print("6. CONCURRENT OVERSELL PROTECTION")
    print("=" * 80)

    # Create a test product with stock=10
    sku = f"CONC-TEST-{int(time.time())}"
    resp = admin.post("/products", {
        "sku": sku,
        "name": "Concurrency Test Product",
        "initial_stock": 10,
        "min_stock": 0
    })
    if resp.status_code != 201:
        result.add_fail("Create product for concurrency test", f"Status {resp.status_code}")
        return

    product_id = resp.json().get("id")

    # Fire 30 parallel exit requests of qty=1 (only 10 should succeed)
    def exit_request():
        try:
            r = admin.post("/movements/exit", {
                "product_id": product_id,
                "qty": 1,
                "reason": "concurrent test"
            })
            return r.status_code
        except Exception as e:
            return 500

    with ThreadPoolExecutor(max_workers=30) as executor:
        futures = [executor.submit(exit_request) for _ in range(30)]
        results = [f.result() for f in futures]

    successes = [r for r in results if r == 201]
    failures = [r for r in results if r != 201]

    # Verify exactly 10 succeeded
    if len(successes) == 10:
        result.add_pass(f"Concurrent oversell: exactly 10/30 exits succeeded")
    else:
        result.add_fail("Concurrent oversell", f"Expected 10 successes, got {len(successes)}")

    # Verify stock is 0
    resp = admin.get(f"/products/{product_id}")
    final_stock = resp.json().get("stock", -1)
    if final_stock == 0:
        result.add_pass("Concurrent oversell: final stock is 0 (no negative stock)")
    else:
        result.add_fail("Concurrent oversell: final stock", f"Expected 0, got {final_stock}")

    # Verify movement count
    resp = admin.get("/movements", params={"product_id": product_id, "type": "exit"})
    movement_count = len(resp.json()) if resp.status_code == 200 else 0
    if movement_count == 10:
        result.add_pass("Concurrent oversell: exactly 10 exit movements recorded")
    else:
        result.add_fail("Concurrent oversell: movement count", f"Expected 10, got {movement_count}")


def test_dashboard(admin: APIClient, result: TestResult):
    """Test dashboard endpoints"""
    print("\n" + "=" * 80)
    print("7. DASHBOARD & ALERTS")
    print("=" * 80)

    # Test dashboard stats
    resp = admin.get("/dashboard/stats")
    if resp.status_code == 200:
        stats = resp.json()
        required_fields = ["total_skus", "total_units", "low_stock", "out_of_stock", "entries_today", "exits_today"]
        if all(field in stats for field in required_fields):
            result.add_pass("GET /dashboard/stats returns all required fields")
        else:
            result.add_fail("GET /dashboard/stats", f"Missing fields: {stats}")
    else:
        result.add_fail("GET /dashboard/stats", f"Status {resp.status_code}")

    # Test movements timeseries
    resp = admin.get("/dashboard/movements-timeseries", params={"days": 7})
    if resp.status_code == 200 and isinstance(resp.json(), list):
        result.add_pass("GET /dashboard/movements-timeseries")
    else:
        result.add_fail("GET /dashboard/movements-timeseries", f"Status {resp.status_code}")

    # Test category distribution
    resp = admin.get("/dashboard/category-distribution")
    if resp.status_code == 200 and isinstance(resp.json(), list):
        result.add_pass("GET /dashboard/category-distribution")
    else:
        result.add_fail("GET /dashboard/category-distribution", f"Status {resp.status_code}")

    # Test alerts
    resp = admin.get("/dashboard/alerts")
    if resp.status_code == 200 and isinstance(resp.json(), list):
        result.add_pass("GET /dashboard/alerts")
    else:
        result.add_fail("GET /dashboard/alerts", f"Status {resp.status_code}")


def test_reports(admin: APIClient, result: TestResult):
    """Test report endpoints"""
    print("\n" + "=" * 80)
    print("8. REPORTS")
    print("=" * 80)

    # Test inventory report
    resp = admin.get("/reports/inventory")
    if resp.status_code == 200:
        result.add_pass("GET /reports/inventory")
    else:
        result.add_fail("GET /reports/inventory", f"Status {resp.status_code}")

    # Test movements report export
    resp = admin.get("/reports/movements/export", params={"format": "xlsx"})
    if resp.status_code == 200:
        result.add_pass("GET /reports/movements/export")
    else:
        result.add_fail("GET /reports/movements/export", f"Status {resp.status_code}")


def test_audit_logs(admin: APIClient, viewer: APIClient, result: TestResult):
    """Test audit logs (admin-only)"""
    print("\n" + "=" * 80)
    print("9. AUDIT LOGS")
    print("=" * 80)

    # Admin can access audit logs
    resp = admin.get("/audit")
    if resp.status_code == 200 and isinstance(resp.json(), list):
        result.add_pass("GET /audit (admin)")
    else:
        result.add_fail("GET /audit (admin)", f"Status {resp.status_code}")

    # Viewer cannot access audit logs
    resp = viewer.get("/audit")
    if resp.status_code == 403:
        result.add_pass("RBAC: Viewer cannot GET /audit (403)")
    else:
        result.add_fail("RBAC: Viewer cannot GET /audit", f"Expected 403, got {resp.status_code}")


def test_users(admin: APIClient, manager: APIClient, result: TestResult):
    """Test user management (admin-only)"""
    print("\n" + "=" * 80)
    print("10. USER MANAGEMENT")
    print("=" * 80)

    # Admin can list users
    resp = admin.get("/users")
    if resp.status_code == 200 and isinstance(resp.json(), list):
        result.add_pass("GET /users (admin)")
    else:
        result.add_fail("GET /users (admin)", f"Status {resp.status_code}")

    # Admin can create user
    test_email = f"testuser{int(time.time())}@company.com"
    resp = admin.post("/users", {
        "email": test_email,
        "password": "TestPass123!",
        "full_name": "Test User",
        "role": "viewer"
    })
    if resp.status_code == 201:
        user_id = resp.json().get("id")
        result.add_pass("POST /users (admin)")

        # Admin can update user
        resp = admin.patch(f"/users/{user_id}", {"role": "manager"})
        if resp.status_code == 200:
            result.add_pass("PATCH /users (admin)")
        else:
            result.add_fail("PATCH /users (admin)", f"Status {resp.status_code}")
    else:
        result.add_fail("POST /users (admin)", f"Status {resp.status_code}: {resp.text}")

    # Manager cannot access users
    resp = manager.get("/users")
    if resp.status_code == 403:
        result.add_pass("RBAC: Manager cannot GET /users (403)")
    else:
        result.add_fail("RBAC: Manager cannot GET /users", f"Expected 403, got {resp.status_code}")


def test_physical_counts(admin: APIClient, product_id: str, result: TestResult):
    """Test physical count workflow"""
    print("\n" + "=" * 80)
    print("11. PHYSICAL COUNTS")
    print("=" * 80)

    # Create count session
    resp = admin.post("/counts", {
        "name": f"Test Count {int(time.time())}",
        "notes": "Test physical count"
    })
    if resp.status_code == 201:
        count_id = resp.json().get("id")
        result.add_pass("POST /counts creates session")

        # Record item in count
        resp = admin.post(f"/counts/{count_id}/items", {
            "product_id": product_id,
            "counted_qty": 95
        })
        if resp.status_code in [200, 201]:
            result.add_pass("POST /counts/{id}/items records item")
        else:
            result.add_fail("POST /counts/{id}/items", f"Status {resp.status_code}")

        # Close count session
        resp = admin.post(f"/counts/{count_id}/close")
        if resp.status_code in [200, 201]:
            result.add_pass("POST /counts/{id}/close generates adjustments")
        else:
            result.add_fail("POST /counts/{id}/close", f"Status {resp.status_code}")

        # List counts
        resp = admin.get("/counts")
        if resp.status_code == 200:
            result.add_pass("GET /counts")
        else:
            result.add_fail("GET /counts", f"Status {resp.status_code}")
    else:
        result.add_fail("POST /counts", f"Status {resp.status_code}: {resp.text}")


def test_import_export(admin: APIClient, result: TestResult):
    """Test import/export functionality"""
    print("\n" + "=" * 80)
    print("12. IMPORT/EXPORT")
    print("=" * 80)

    # Test template download
    resp = admin.get("/import/template")
    if resp.status_code == 200:
        result.add_pass("GET /import/template")
    else:
        result.add_fail("GET /import/template", f"Status {resp.status_code}")

    # Test export endpoints
    for format_type in ["csv", "xlsx"]:
        resp = admin.get(f"/reports/inventory/export?format={format_type}")
        if resp.status_code == 200 and len(resp.content) > 0:
            result.add_pass(f"GET /reports/inventory/export?format={format_type}")
        else:
            result.add_fail(f"GET /reports/inventory/export?format={format_type}", f"Status {resp.status_code}")


def main():
    print("\n" + "=" * 80)
    print("IT INVENTORY MANAGEMENT SYSTEM - COMPREHENSIVE BACKEND TEST")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Started at: {datetime.now().isoformat()}")
    print("=" * 80)

    result = TestResult()

    try:
        # 1. Health check
        test_health(result)

        # 2. Authentication
        admin, manager, viewer = test_auth(result)

        if not admin.token:
            print("\n❌ CRITICAL: Admin authentication failed. Cannot proceed with tests.")
            result.summary()
            return 1

        # 3. Master data
        master_ids = test_master_data(admin, manager, viewer, result)

        # 4. Products
        product_id = test_products(admin, manager, viewer, master_ids, result)

        if not product_id:
            print("\n⚠️  WARNING: Product creation failed. Skipping movement tests.")
        else:
            # 5. Movements
            test_movements(admin, manager, viewer, product_id, result)

            # 6. Concurrent oversell
            test_concurrent_oversell(admin, result)

            # 11. Physical counts
            test_physical_counts(admin, product_id, result)

        # 7. Dashboard
        test_dashboard(admin, result)

        # 8. Reports
        test_reports(admin, result)

        # 9. Audit logs
        test_audit_logs(admin, viewer, result)

        # 10. Users
        test_users(admin, manager, result)

        # 12. Import/Export
        test_import_export(admin, result)

        # Summary
        success = result.summary()
        print(f"\nCompleted at: {datetime.now().isoformat()}")

        return 0 if success else 1

    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        result.summary()
        return 1


if __name__ == "__main__":
    sys.exit(main())
