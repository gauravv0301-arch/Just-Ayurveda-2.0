"""
Iteration 8 — Production hardening:
- Health
- Razorpay LIVE order create (no actual payment captured)
- Razorpay webhook signature/idempotency/event handling
- Twilio OTP rate limit + Indian mobile validation
- verify-otp wired correctly
- multi-image admin upload still works
"""
import os
import io
import hmac
import json
import time
import uuid
import hashlib
from datetime import datetime, timezone

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ayurveda-wellness-30.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
WEBHOOK_SECRET = "whsec_ja_1b77f0b78873d838191d666a990089a679228c83"

# Direct mongo handle for cleanup + seeding inspection
_mongo = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
db = _mongo[os.environ.get("DB_NAME", "test_database")]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": "admin@justayurveda.in", "password": "admin123"}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def a_product_id():
    p = db.products.find_one({}, {"_id": 0, "id": 1, "price": 1})
    assert p, "no products seeded"
    return p["id"]


# ===== Health =====
def test_health():
    r = requests.get(f"{API}/health", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") in ("ok", "healthy") or "status" in r.json()


# ===== Orders create (LIVE Razorpay — only verifies order_id created, NO payment) =====
def test_orders_create_returns_razorpay_order_id(a_product_id):
    payload = {
        "product_id": a_product_id,
        "quantity": 1,
        "customer_name": "TEST Buyer",
        "customer_email": "test_buyer@example.com",
        "customer_phone": "9876543210",
        "customer_address": "Test addr",
    }
    r = requests.post(f"{API}/orders/create", json=payload, timeout=20)
    assert r.status_code == 200, f"orders/create failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["razorpay_order_id"].startswith("order_"), f"got {data['razorpay_order_id']}"
    assert data["currency"] == "INR"
    assert isinstance(data["amount"], int) and data["amount"] > 0
    # cleanup
    db.orders.delete_one({"id": data["order_id"]})


# ===== Razorpay Webhook =====
def _sign(body_bytes: bytes) -> str:
    return hmac.new(WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()


def test_webhook_rejects_bad_signature():
    body = json.dumps({"event": "payment.captured"}).encode()
    r = requests.post(f"{API}/razorpay/webhook", data=body,
                      headers={"X-Razorpay-Signature": "deadbeef", "Content-Type": "application/json"},
                      timeout=10)
    assert r.status_code == 400, f"expected 400 got {r.status_code}: {r.text}"


def test_webhook_rejects_missing_signature():
    body = json.dumps({"event": "payment.captured"}).encode()
    r = requests.post(f"{API}/razorpay/webhook", data=body,
                      headers={"Content-Type": "application/json"}, timeout=10)
    assert r.status_code == 400


@pytest.fixture
def seeded_order():
    """Insert a fake order doc with a known razorpay_order_id."""
    rzp_oid = f"order_TEST{uuid.uuid4().hex[:14]}"
    order_id = f"JA-TEST{uuid.uuid4().hex[:6].upper()}"
    db.orders.insert_one({
        "id": order_id, "razorpay_order_id": rzp_oid, "status": "pending",
        "amount": 100, "amount_paise": 10000, "created_at": datetime.now(timezone.utc).isoformat(),
        "product_id": "x", "product_name": "x", "quantity": 1,
        "customer_name": "t", "customer_email": "t@t", "customer_phone": "9999999999",
    })
    yield order_id, rzp_oid
    db.orders.delete_one({"id": order_id})


def test_webhook_payment_captured_updates_order_and_dedup(seeded_order):
    order_id, rzp_oid = seeded_order
    event_id = f"evt_TEST_{uuid.uuid4().hex[:10]}"
    db.webhook_events.delete_one({"event_id": event_id})
    payload = {
        "id": event_id,
        "event": "payment.captured",
        "payload": {"payment": {"entity": {"id": f"pay_TEST{uuid.uuid4().hex[:10]}", "order_id": rzp_oid}}},
    }
    body = json.dumps(payload).encode()
    sig = _sign(body)
    r = requests.post(f"{API}/razorpay/webhook", data=body,
                      headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"}, timeout=10)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "ok"
    # Verify order updated
    o = db.orders.find_one({"id": order_id})
    assert o["status"] == "paid", f"order status not paid: {o.get('status')}"

    # Replay same event → should be deduped
    r2 = requests.post(f"{API}/razorpay/webhook", data=body,
                       headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"}, timeout=10)
    assert r2.status_code == 200
    assert r2.json().get("duplicate") is True, f"expected duplicate=true, got {r2.json()}"
    # cleanup
    db.webhook_events.delete_one({"event_id": event_id})


def test_webhook_payment_failed_updates_order(seeded_order):
    order_id, rzp_oid = seeded_order
    event_id = f"evt_TEST_{uuid.uuid4().hex[:10]}"
    payload = {
        "id": event_id,
        "event": "payment.failed",
        "payload": {"payment": {"entity": {
            "id": f"pay_TEST{uuid.uuid4().hex[:10]}", "order_id": rzp_oid,
            "error_description": "Test failure"}}},
    }
    body = json.dumps(payload).encode()
    sig = _sign(body)
    r = requests.post(f"{API}/razorpay/webhook", data=body,
                      headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"}, timeout=10)
    assert r.status_code == 200
    o = db.orders.find_one({"id": order_id})
    assert o["status"] == "failed"
    assert o.get("failure_reason") == "Test failure"
    db.webhook_events.delete_one({"event_id": event_id})


# ===== OTP =====
def test_send_otp_rejects_non_indian():
    r = requests.post(f"{API}/customer/send-otp", json={"phone": "12345"}, timeout=10)
    assert r.status_code == 400, r.text
    assert "Indian" in r.json().get("detail", "")


def test_send_otp_rejects_starting_5():
    # validation: 10 digit but starts with non 6-9
    r = requests.post(f"{API}/customer/send-otp", json={"phone": "5234567890"}, timeout=10)
    assert r.status_code == 400


def test_send_otp_valid_indian_and_rate_limit():
    phone = "9" + str(random_digit_seq(9))
    # Clean previous logs/otp for this phone
    db.otp_log.delete_many({"phone": phone})
    db.otps.delete_many({"phone": phone})

    results = []
    for i in range(4):
        r = requests.post(f"{API}/customer/send-otp", json={"phone": phone}, timeout=15)
        results.append(r.status_code)
        time.sleep(0.4)

    # First 3 calls: accept 200 (success) or 502 (Twilio unverified number) — both indicate code path executed
    for code in results[:3]:
        assert code in (200, 502), f"unexpected status in first 3: {code}"

    # 4th should be 429 (rate limit) — but only if first 3 actually hit. 502 still inserts otp_log so should rate-limit.
    assert results[3] == 429, f"4th call expected 429, got {results[3]} (all: {results})"

    db.otp_log.delete_many({"phone": phone})
    db.otps.delete_many({"phone": phone})


def random_digit_seq(n):
    import random as _r
    return "".join(str(_r.randint(0, 9)) for _ in range(n))


# ===== verify-otp (still works using stored OTP) =====
def test_verify_otp_with_seeded_record():
    phone = "9" + random_digit_seq(9)
    otp_code = "123456"
    db.otps.delete_many({"phone": phone})
    db.customers.delete_many({"phone": phone})
    db.otps.insert_one({
        "phone": phone, "otp": otp_code,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc).replace(year=datetime.now(timezone.utc).year + 1),
        "attempts": 0,
    })
    r = requests.post(f"{API}/customer/verify-otp", json={"phone": phone, "otp": otp_code, "name": "TEST V"}, timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "customer" in data
    assert data["customer"]["phone"] == phone
    # cleanup
    db.customers.delete_many({"phone": phone})


def test_verify_otp_invalid():
    r = requests.post(f"{API}/customer/verify-otp", json={"phone": "9999999999", "otp": "000000"}, timeout=10)
    assert r.status_code == 400


# ===== Admin multi-image upload still works =====
def _png_bytes():
    # tiny 1x1 PNG
    import base64
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    )


def test_admin_upload_multifile(admin_token):
    files = [
        ("files", ("a.png", io.BytesIO(_png_bytes()), "image/png")),
        ("files", ("b.png", io.BytesIO(_png_bytes()), "image/png")),
    ]
    r = requests.post(f"{API}/admin/upload", files=files,
                      headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "files" in data and len(data["files"]) == 2
    for f in data["files"]:
        assert "url" in f and f["url"]


def test_admin_upload_rejects_bad_mime(admin_token):
    files = [("files", ("evil.txt", io.BytesIO(b"hello"), "text/plain"))]
    r = requests.post(f"{API}/admin/upload", files=files,
                      headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
    assert r.status_code in (400, 415)
