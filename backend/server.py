from fastapi import FastAPI, APIRouter, Query, HTTPException, Depends, UploadFile, File, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt as pyjwt
import random
import string
import requests as http_requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay
try:
    import razorpay
    rzp_key = os.environ.get('RAZORPAY_KEY_ID', '')
    rzp_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
    razorpay_client = razorpay.Client(auth=(rzp_key, rzp_secret)) if rzp_key and rzp_secret else None
except Exception:
    razorpay_client = None

JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback-secret')
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ===== AUTH HELPERS =====
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role, "exp": datetime.now(timezone.utc) + timedelta(hours=24)}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = pyjwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('role') != 'admin':
            raise HTTPException(403, "Admin access required")
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

async def get_optional_customer(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        p = pyjwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return p if p.get('role') == 'customer' else None
    except:
        return None

# ===== MODELS =====
class LoginRequest(BaseModel):
    email: str
    password: str

class OrderCreateRequest(BaseModel):
    product_id: str
    quantity: int = 1
    customer_name: str
    customer_email: str
    customer_phone: str
    customer_address: str = ""
    coupon_code: str = ""
    discount_amount: float = 0

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str

# ===== STORAGE (Emergent Object Storage) =====
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "just-ayurveda"
_storage_key = None
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
EXT_FOR_MIME = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

def init_storage():
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY not set")
    resp = http_requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = http_requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = http_requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

def _normalize_product_images(doc: dict) -> dict:
    """Ensure both `image` (primary URL) and `images` array stay in sync."""
    images = doc.get("images") or []
    # Filter invalid entries
    images = [i for i in images if isinstance(i, dict) and i.get("url")]
    if images:
        primary = next((i for i in images if i.get("isPrimary")), None)
        if not primary:
            images[0]["isPrimary"] = True
            primary = images[0]
        # Enforce single primary
        for i in images:
            i["isPrimary"] = (i["url"] == primary["url"])
        doc["image"] = primary["url"]
        doc["images"] = images
    elif doc.get("image"):
        # Backward compatibility: derive images from legacy `image`
        doc["images"] = [{"url": doc["image"], "isPrimary": True}]
    else:
        doc["images"] = []
    return doc

class ProductCreateRequest(BaseModel):
    name: str
    slug: str
    short_description: str
    description: str
    highlights: List[str] = []
    ingredients: str = ""
    usage_guide: str = ""
    price: float
    original_price: float
    image: str = ""
    images: List[Dict[str, Any]] = []
    category: str = ""
    popularity: int = 50
    faqs: List[dict] = []
    reviews: List[dict] = []

# ===== AUTH ENDPOINTS =====
@api_router.post("/auth/login")
async def login(req: LoginRequest):
    user = await db.admin_users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user['password_hash']):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(str(user['_id']), user['email'], user.get('role', 'admin'))
    return {"token": token, "email": user['email'], "name": user.get('name', 'Admin'), "role": user.get('role', 'admin')}

@api_router.get("/auth/me")
async def get_me(admin=Depends(get_current_admin)):
    return {"email": admin['email'], "role": admin['role']}

# ===== PRODUCT ENDPOINTS =====
@api_router.get("/")
async def root():
    return {"message": "Just Ayurveda API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}


@api_router.get("/products")
async def get_products(search: Optional[str] = Query(None), sort: Optional[str] = Query("popularity"), category: Optional[str] = Query(None)):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"short_description": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]
    if category and category != "all":
        query["category"] = {"$regex": category, "$options": "i"}
    sort_field, sort_order = "popularity", -1
    if sort == "price_low": sort_field, sort_order = "price", 1
    elif sort == "price_high": sort_field, sort_order = "price", -1
    elif sort == "newest": sort_field, sort_order = "created_at", -1
    products = await db.products.find(query, {"_id": 0}).sort(sort_field, sort_order).to_list(100)
    return products

@api_router.get("/products/slug/{slug}")
async def get_product_by_slug(slug: str):
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Product not found")
    return product

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Product not found")
    return product

# ===== ADMIN PRODUCT ENDPOINTS =====
@api_router.post("/admin/products")
async def create_product(product: ProductCreateRequest, admin=Depends(get_current_admin)):
    doc = product.model_dump()
    doc = _normalize_product_images(doc)
    doc['id'] = f"prod-{str(uuid.uuid4())[:8]}"
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(doc)
    created = await db.products.find_one({"id": doc['id']}, {"_id": 0})
    return created

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, product: ProductCreateRequest, admin=Depends(get_current_admin)):
    doc = product.model_dump()
    doc = _normalize_product_images(doc)
    result = await db.products.update_one({"id": product_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(404, "Product not found")
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_current_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Product not found")
    return {"message": "Product deleted"}

# ===== ADMIN IMAGE UPLOAD =====
@api_router.post("/admin/upload")
async def admin_upload(files: List[UploadFile] = File(...), admin=Depends(get_current_admin)):
    if len(files) > 10:
        raise HTTPException(400, "Maximum 10 files per upload request")
    uploaded = []
    for f in files:
        ct = (f.content_type or "").lower()
        if ct not in ALLOWED_MIME:
            raise HTTPException(400, f"Unsupported file type: {ct or 'unknown'}. Allowed: JPG, PNG, WEBP")
        data = await f.read()
        if len(data) > MAX_IMAGE_SIZE:
            raise HTTPException(400, f"{f.filename}: exceeds 5MB limit")
        ext = EXT_FOR_MIME.get(ct, "bin")
        path = f"{APP_NAME}/products/{uuid.uuid4().hex}.{ext}"
        try:
            result = put_object(path, data, ct)
        except Exception as e:
            logging.error(f"Storage upload failed: {e}")
            raise HTTPException(500, "Storage upload failed. Please try again.")
        url = f"/api/files/{result['path']}"
        await db.files.insert_one({
            "id": str(uuid.uuid4()),
            "storage_path": result['path'],
            "original_filename": f.filename,
            "content_type": ct,
            "size": result.get('size', len(data)),
            "url": url,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        uploaded.append({"url": url, "path": result['path'], "filename": f.filename, "size": len(data)})
    return {"files": uploaded}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(404, "File not found")
    try:
        data, ct = get_object(path)
    except Exception:
        raise HTTPException(404, "File not found in storage")
    return Response(
        content=data,
        media_type=record.get("content_type") or ct,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )

# ===== ORDER ENDPOINTS =====
@api_router.post("/orders/create")
async def create_order(req: OrderCreateRequest, customer=Depends(get_optional_customer)):
    product = await db.products.find_one({"id": req.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Product not found")
    subtotal = product['price'] * req.quantity
    discount = req.discount_amount if req.discount_amount > 0 else 0
    final_amount = subtotal - discount
    amount_paise = int(final_amount * 100)
    if amount_paise < 100:
        raise HTTPException(400, "Order amount must be at least ₹1 (100 paise)")
    order_id = f"JA-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"
    razorpay_order_id = None
    if razorpay_client:
        try:
            rzp_order = razorpay_client.order.create({"amount": amount_paise, "currency": "INR", "receipt": order_id[:40], "payment_capture": 1})
            razorpay_order_id = rzp_order['id']
        except Exception as e:
            err_str = str(e).lower()
            logging.error(f"Razorpay order create failed: {e}")
            if 'authentication' in err_str or 'auth' in err_str or '401' in err_str:
                raise HTTPException(401, "Razorpay authentication failed. Please contact support.")
            raise HTTPException(502, f"Could not initiate payment. {str(e)[:200]}")
    else:
        raise HTTPException(400, "Payment gateway not configured. Add valid Razorpay API keys to backend .env")
    # Increment coupon usage
    if req.coupon_code:
        await db.coupons.update_one({"code": req.coupon_code.upper()}, {"$inc": {"used_count": 1}})
    order = {
        "id": order_id, "product_id": product['id'], "product_name": product['name'],
        "product_image": product.get('image', ''), "quantity": req.quantity,
        "amount": final_amount, "subtotal": subtotal, "discount": discount,
        "coupon_code": req.coupon_code or None, "amount_paise": amount_paise,
        "customer_name": req.customer_name, "customer_email": req.customer_email,
        "customer_phone": req.customer_phone, "customer_address": req.customer_address,
        "razorpay_order_id": razorpay_order_id, "razorpay_payment_id": None,
        "razorpay_signature": None, "status": "pending",
        "customer_id": customer['sub'] if customer else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)
    return {"order_id": order_id, "razorpay_order_id": razorpay_order_id, "amount": amount_paise, "currency": "INR", "product_name": product['name']}

@api_router.post("/orders/verify")
async def verify_payment(req: PaymentVerifyRequest):
    if not razorpay_client:
        raise HTTPException(400, "Payment gateway not configured")
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': req.razorpay_order_id,
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_signature': req.razorpay_signature
        })
    except Exception:
        await db.orders.update_one({"id": req.order_id}, {"$set": {"status": "failed"}})
        raise HTTPException(400, "Payment verification failed")
    await db.orders.update_one({"id": req.order_id}, {"$set": {"status": "paid", "razorpay_payment_id": req.razorpay_payment_id, "razorpay_signature": req.razorpay_signature}})
    order = await db.orders.find_one({"id": req.order_id}, {"_id": 0})
    return order

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    return order

# ===== RAZORPAY WEBHOOK =====
# Configure in Razorpay Dashboard → Settings → Webhooks → Add new
#   URL:    https://<your-domain>/api/razorpay/webhook
#   Secret: same as env RAZORPAY_WEBHOOK_SECRET
#   Events: payment.captured, payment.failed
import hmac
import hashlib

@api_router.post("/razorpay/webhook")
async def razorpay_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")
    if not secret:
        logging.warning("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET not configured")
        raise HTTPException(503, "Webhook not configured")
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        logging.warning("Razorpay webhook signature mismatch")
        raise HTTPException(400, "Invalid signature")

    import json as _json
    try:
        payload = _json.loads(body)
    except Exception:
        raise HTTPException(400, "Invalid JSON")

    event = payload.get("event")
    event_id = payload.get("id") or payload.get("event_id") or f"{event}:{rzp_payment_id_check}" if (rzp_payment_id_check := (payload.get('payload') or {}).get('payment', {}).get('entity', {}).get('id')) else event
    pmt = (payload.get("payload") or {}).get("payment", {}).get("entity", {})
    rzp_order_id = pmt.get("order_id")
    rzp_payment_id = pmt.get("id")

    if not rzp_order_id:
        return {"status": "ignored", "reason": "no order_id"}

    # Idempotency: skip if this event was already processed
    if event_id:
        already = await db.webhook_events.find_one({"event_id": event_id})
        if already:
            return {"status": "ok", "event": event, "duplicate": True}
        await db.webhook_events.insert_one({
            "event_id": event_id,
            "event": event,
            "rzp_order_id": rzp_order_id,
            "rzp_payment_id": rzp_payment_id,
            "received_at": datetime.now(timezone.utc).isoformat(),
        })

    if event == "payment.captured":
        await db.orders.update_one(
            {"razorpay_order_id": rzp_order_id},
            {"$set": {
                "status": "paid",
                "razorpay_payment_id": rzp_payment_id,
                "webhook_event": event,
                "webhook_received_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
    elif event == "payment.failed":
        await db.orders.update_one(
            {"razorpay_order_id": rzp_order_id},
            {"$set": {
                "status": "failed",
                "razorpay_payment_id": rzp_payment_id,
                "failure_reason": pmt.get("error_description") or pmt.get("error_reason") or "unknown",
                "webhook_event": event,
                "webhook_received_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
    else:
        logging.info(f"Unhandled Razorpay webhook event: {event}")

    return {"status": "ok", "event": event}

# ============================================
# ===== REVIEWS SYSTEM (Customer + Admin) =====
# ============================================
class ReviewSubmitRequest(BaseModel):
    product_id: str
    name: str
    rating: int  # 1-5
    title: str = ""
    comment: str

@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    """Public: list approved reviews + aggregated stats for a product."""
    cursor = db.reviews.find({"product_id": product_id, "status": "approved"}, {"_id": 0}).sort("created_at", -1)
    reviews = await cursor.to_list(100)
    # Include legacy embedded reviews from product doc for backward compatibility
    product = await db.products.find_one({"id": product_id}, {"_id": 0, "reviews": 1})
    legacy = [{**r, "is_legacy": True, "created_at": "2026-01-01T00:00:00Z"} for r in (product.get("reviews", []) if product else [])]
    all_reviews = reviews + legacy
    total = len(all_reviews)
    avg = round(sum(r.get("rating", 0) for r in all_reviews) / total, 1) if total else 0
    return {"reviews": all_reviews, "total": total, "average_rating": avg}

@api_router.post("/reviews")
async def submit_review(req: ReviewSubmitRequest, customer=Depends(get_optional_customer)):
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(400, "Rating must be between 1 and 5")
    if not req.comment.strip() or len(req.comment.strip()) < 5:
        raise HTTPException(400, "Review comment must be at least 5 characters")
    if not req.name.strip():
        raise HTTPException(400, "Name is required")
    # Verify product exists
    product = await db.products.find_one({"id": req.product_id}, {"_id": 0, "id": 1})
    if not product:
        raise HTTPException(404, "Product not found")
    # Anti-spam: if logged in, only 1 review per customer per product. If guest, dedupe by name+product+24h.
    if customer:
        existing = await db.reviews.find_one({"product_id": req.product_id, "customer_id": customer['sub']})
        if existing:
            raise HTTPException(400, "You have already reviewed this product")
    else:
        recent_cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        existing = await db.reviews.find_one({
            "product_id": req.product_id,
            "name": req.name.strip(),
            "created_at": {"$gte": recent_cutoff.isoformat()},
        })
        if existing:
            raise HTTPException(400, "A review under this name was already submitted recently")
    # Verify purchase for logged-in customer (granted optional)
    verified = False
    if customer:
        paid_order = await db.orders.find_one({
            "customer_id": customer['sub'],
            "product_id": req.product_id,
            "status": "paid",
        })
        verified = paid_order is not None
    doc = {
        "id": str(uuid.uuid4()),
        "product_id": req.product_id,
        "name": req.name.strip()[:60],
        "rating": req.rating,
        "title": req.title.strip()[:120],
        "comment": req.comment.strip()[:2000],
        "customer_id": customer['sub'] if customer else None,
        "verified_purchase": verified,
        "status": "pending",  # pending | approved | rejected
        "featured": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(doc)
    return {"message": "Review submitted. It will appear after admin approval.", "review_id": doc["id"]}

@api_router.get("/admin/reviews")
async def admin_list_reviews(admin=Depends(get_current_admin), status: Optional[str] = Query(None)):
    q = {}
    if status and status != "all":
        q["status"] = status
    reviews = await db.reviews.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Attach product name
    product_ids = list({r["product_id"] for r in reviews})
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(500)
    name_map = {p["id"]: p["name"] for p in products}
    for r in reviews:
        r["product_name"] = name_map.get(r["product_id"], "—")
    return reviews

@api_router.put("/admin/reviews/{review_id}")
async def admin_update_review(review_id: str, body: dict, admin=Depends(get_current_admin)):
    allowed = {k: v for k, v in body.items() if k in ("status", "featured")}
    if not allowed:
        raise HTTPException(400, "Nothing to update")
    if "status" in allowed and allowed["status"] not in ("pending", "approved", "rejected"):
        raise HTTPException(400, "Invalid status")
    result = await db.reviews.update_one({"id": review_id}, {"$set": allowed})
    if result.matched_count == 0:
        raise HTTPException(404, "Review not found")
    updated = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, admin=Depends(get_current_admin)):
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Review not found")
    return {"message": "Review deleted"}

# ===========================================
# ===== COUPON ANALYTICS (Admin only) =====
# ===========================================
@api_router.get("/admin/analytics/coupons")
async def admin_coupon_analytics(admin=Depends(get_current_admin), days: int = Query(30, ge=1, le=365)):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(500)
    total_coupons = len(coupons)
    active = [c for c in coupons if c.get("active") and (not c.get("expiry") or c["expiry"] > datetime.now(timezone.utc).isoformat())]
    expired = [c for c in coupons if c.get("expiry") and c["expiry"] <= datetime.now(timezone.utc).isoformat()]

    # Orders that used a coupon
    coupon_orders = await db.orders.find(
        {"coupon_code": {"$ne": None}, "status": "paid", "created_at": {"$gte": cutoff}},
        {"_id": 0, "coupon_code": 1, "amount": 1, "discount": 1, "subtotal": 1, "created_at": 1, "product_name": 1},
    ).to_list(1000)
    total_redemptions = len(coupon_orders)
    revenue = sum(o.get("amount", 0) for o in coupon_orders)
    discount_given = sum(o.get("discount", 0) for o in coupon_orders)

    # Top coupons by redemption count
    from collections import Counter, defaultdict
    use_count = Counter(o["coupon_code"] for o in coupon_orders)
    rev_by_code = defaultdict(float)
    for o in coupon_orders:
        rev_by_code[o["coupon_code"]] += o.get("amount", 0)
    top = sorted(
        [{"code": c, "redemptions": n, "revenue": round(rev_by_code[c], 2)} for c, n in use_count.items()],
        key=lambda x: x["redemptions"], reverse=True,
    )[:5]

    # Daily series for chart (last N days)
    series_map = defaultdict(lambda: {"redemptions": 0, "revenue": 0.0, "discount": 0.0})
    for o in coupon_orders:
        day = (o.get("created_at") or "")[:10]
        if day:
            series_map[day]["redemptions"] += 1
            series_map[day]["revenue"] += o.get("amount", 0)
            series_map[day]["discount"] += o.get("discount", 0)
    series = [{"date": d, **v} for d, v in sorted(series_map.items())]

    # Total orders (paid) in window for redemption rate calc
    total_paid_orders = await db.orders.count_documents({"status": "paid", "created_at": {"$gte": cutoff}})
    redemption_rate = round((total_redemptions / total_paid_orders) * 100, 1) if total_paid_orders > 0 else 0

    return {
        "window_days": days,
        "total_coupons": total_coupons,
        "active_coupons": len(active),
        "expired_coupons": len(expired),
        "total_redemptions": total_redemptions,
        "redemption_rate": redemption_rate,
        "revenue_from_coupons": round(revenue, 2),
        "total_discount_given": round(discount_given, 2),
        "top_coupons": top,
        "daily_series": series,
        "total_paid_orders": total_paid_orders,
    }

# =================================
# ===== BLOG / ARTICLES SYSTEM ===
# =================================
class BlogCreateRequest(BaseModel):
    title: str
    slug: str = ""
    excerpt: str = ""
    content: str
    featured_image: str = ""
    tags: List[str] = []
    seo_title: str = ""
    seo_description: str = ""
    status: str = "draft"  # draft | published

def _slugify(text: str) -> str:
    import re as _re
    s = text.lower().strip()
    s = _re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80]

@api_router.get("/blog")
async def list_blog(tag: Optional[str] = Query(None), search: Optional[str] = Query(None)):
    q = {"status": "published"}
    if tag:
        q["tags"] = tag
    if search:
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
        ]
    posts = await db.blog_posts.find(q, {"_id": 0, "content": 0}).sort("published_at", -1).to_list(100)
    return posts

@api_router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog_posts.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Article not found")
    related = await db.blog_posts.find(
        {"status": "published", "slug": {"$ne": slug}, "tags": {"$in": post.get("tags", [])}},
        {"_id": 0, "content": 0},
    ).limit(3).to_list(3)
    post["related"] = related
    return post

@api_router.get("/admin/blog")
async def admin_list_blog(admin=Depends(get_current_admin)):
    posts = await db.blog_posts.find({}, {"_id": 0, "content": 0}).sort("created_at", -1).to_list(500)
    return posts

@api_router.get("/admin/blog/{post_id}")
async def admin_get_blog(post_id: str, admin=Depends(get_current_admin)):
    post = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Article not found")
    return post

@api_router.post("/admin/blog")
async def admin_create_blog(req: BlogCreateRequest, admin=Depends(get_current_admin)):
    slug = req.slug.strip() or _slugify(req.title)
    if not slug:
        raise HTTPException(400, "Slug or title is required")
    if await db.blog_posts.find_one({"slug": slug}):
        raise HTTPException(400, "Slug already exists, please pick another")
    if req.status not in ("draft", "published"):
        raise HTTPException(400, "Invalid status")
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        **req.model_dump(),
        "id": str(uuid.uuid4()),
        "slug": slug,
        "author": admin.get("email", "Admin"),
        "created_at": now,
        "updated_at": now,
        "published_at": now if req.status == "published" else None,
    }
    await db.blog_posts.insert_one(doc)
    return await db.blog_posts.find_one({"id": doc["id"]}, {"_id": 0})

@api_router.put("/admin/blog/{post_id}")
async def admin_update_blog(post_id: str, req: BlogCreateRequest, admin=Depends(get_current_admin)):
    existing = await db.blog_posts.find_one({"id": post_id})
    if not existing:
        raise HTTPException(404, "Article not found")
    slug = req.slug.strip() or _slugify(req.title)
    # Slug uniqueness if changed
    if slug != existing.get("slug"):
        if await db.blog_posts.find_one({"slug": slug, "id": {"$ne": post_id}}):
            raise HTTPException(400, "Slug already exists")
    now = datetime.now(timezone.utc).isoformat()
    update = {**req.model_dump(), "slug": slug, "updated_at": now}
    # Set published_at when moving draft → published for first time
    if req.status == "published" and not existing.get("published_at"):
        update["published_at"] = now
    await db.blog_posts.update_one({"id": post_id}, {"$set": update})
    return await db.blog_posts.find_one({"id": post_id}, {"_id": 0})

@api_router.delete("/admin/blog/{post_id}")
async def admin_delete_blog(post_id: str, admin=Depends(get_current_admin)):
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Article not found")
    return {"message": "Article deleted"}

@api_router.get("/admin/orders")
async def get_all_orders(admin=Depends(get_current_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

# ===== ADMIN USER MANAGEMENT =====
@api_router.get("/admin/users")
async def get_all_users(admin=Depends(get_current_admin), search: Optional[str] = Query(None)):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$limit": 200},
        {"$lookup": {"from": "orders", "localField": "id", "foreignField": "customer_id", "as": "_orders"}},
        {"$addFields": {"order_count": {"$size": "$_orders"}}},
        {"$project": {"_id": 0, "password_hash": 0, "_orders": 0}}
    ]
    users = await db.customers.aggregate(pipeline).to_list(200)
    return users

@api_router.get("/admin/users/{user_id}")
async def get_user_details(user_id: str, admin=Depends(get_current_admin)):
    user = await db.customers.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(404, "User not found")
    user['orders'] = await db.orders.find({"customer_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    user['order_count'] = len(user['orders'])
    return user

@api_router.put("/admin/users/{user_id}/block")
async def toggle_block_user(user_id: str, admin=Depends(get_current_admin)):
    user = await db.customers.find_one({"id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    new_status = not user.get('blocked', False)
    await db.customers.update_one({"id": user_id}, {"$set": {"blocked": new_status}})
    return {"blocked": new_status}

# ===== COUPON MANAGEMENT =====
class CouponRequest(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    min_order: float = 0
    max_discount: float = 0
    expiry: str = ""
    usage_limit: int = 0
    active: bool = True

@api_router.get("/admin/coupons")
async def get_all_coupons(admin=Depends(get_current_admin)):
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return coupons

@api_router.post("/admin/coupons")
async def create_coupon(req: CouponRequest, admin=Depends(get_current_admin)):
    existing = await db.coupons.find_one({"code": req.code.upper()})
    if existing:
        raise HTTPException(400, "Coupon code already exists")
    doc = req.model_dump()
    doc['id'] = str(uuid.uuid4())
    doc['code'] = doc['code'].upper()
    doc['used_count'] = 0
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.coupons.insert_one(doc)
    created = await db.coupons.find_one({"id": doc['id']}, {"_id": 0})
    return created

@api_router.put("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, req: CouponRequest, admin=Depends(get_current_admin)):
    doc = req.model_dump()
    doc['code'] = doc['code'].upper()
    result = await db.coupons.update_one({"id": coupon_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(404, "Coupon not found")
    updated = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, admin=Depends(get_current_admin)):
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Coupon not found")
    return {"message": "Coupon deleted"}

# ===== PUBLIC COUPON VALIDATION =====
class CouponValidateRequest(BaseModel):
    code: str
    order_total: float

@api_router.post("/coupons/validate")
async def validate_coupon(req: CouponValidateRequest):
    coupon = await db.coupons.find_one({"code": req.code.upper(), "active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(400, "Invalid coupon code")
    # Check expiry
    if coupon.get('expiry'):
        try:
            expiry = datetime.fromisoformat(coupon['expiry'].replace('Z', '+00:00'))
            if datetime.now(timezone.utc) > expiry:
                raise HTTPException(400, "Coupon has expired")
        except (ValueError, TypeError):
            pass
    # Check usage limit
    if coupon.get('usage_limit', 0) > 0 and coupon.get('used_count', 0) >= coupon['usage_limit']:
        raise HTTPException(400, "Coupon usage limit reached")
    # Check min order
    if coupon.get('min_order', 0) > 0 and req.order_total < coupon['min_order']:
        raise HTTPException(400, f"Minimum order of \u20B9{int(coupon['min_order'])} required")
    # Calculate discount
    discount = (req.order_total * coupon['discount_value']) / 100
    if coupon.get('max_discount', 0) > 0:
        discount = min(discount, coupon['max_discount'])
    return {"valid": True, "coupon": coupon, "discount": round(discount, 2), "final_total": round(req.order_total - discount, 2)}

# ===== CONTACT FORM =====
class ContactRequest(BaseModel):
    name: str
    phone: str
    email: str
    message: str

@api_router.post("/contact")
async def submit_contact(req: ContactRequest):
    if not req.name.strip() or not req.email.strip() or not req.phone.strip() or not req.message.strip():
        raise HTTPException(400, "All fields are required")
    if '@' not in req.email or '.' not in req.email.split('@')[-1]:
        raise HTTPException(400, "Invalid email format")
    doc = req.model_dump()
    doc['id'] = str(uuid.uuid4())
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    doc['status'] = 'new'
    await db.contact_messages.insert_one(doc)
    return {"message": "Contact form submitted successfully", "id": doc['id']}

# ===== CUSTOMER AUTH =====
class SendOtpRequest(BaseModel):
    phone: str

class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str
    name: str = ""

class EmailRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: str = ""

class EmailLoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    name: str = ""
    email: str = ""

class AddressRequest(BaseModel):
    label: str = "Home"
    house: str
    street: str
    landmark: str = ""
    city: str
    state: str
    pincode: str
    is_default: bool = False

def create_customer_token(cid: str, phone: str = "", email: str = "") -> str:
    return pyjwt.encode({"sub": cid, "phone": phone, "email": email, "role": "customer", "exp": datetime.now(timezone.utc) + timedelta(days=30)}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_customer(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(401, "Login required")
    try:
        p = pyjwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if p.get('role') != 'customer':
            raise HTTPException(403, "Customer access required")
        return p
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

# ===== TWILIO SMS CLIENT =====
try:
    from twilio.rest import Client as TwilioClient
    from twilio.base.exceptions import TwilioRestException
    _tw_sid = os.environ.get('TWILIO_ACCOUNT_SID', '')
    _tw_token = os.environ.get('TWILIO_AUTH_TOKEN', '')
    _tw_phone = os.environ.get('TWILIO_PHONE_NUMBER', '')
    twilio_client = TwilioClient(_tw_sid, _tw_token) if _tw_sid and _tw_token else None
except Exception as _e:
    twilio_client = None
    TwilioRestException = Exception
    logging.warning(f"Twilio not available: {_e}")

def _normalize_indian_phone(phone: str) -> str:
    """Ensure phone is in E.164 format for India. Returns +91XXXXXXXXXX."""
    p = phone.strip().replace(" ", "").replace("-", "")
    if p.startswith('+'):
        return p
    if p.startswith('91') and len(p) == 12:
        return f"+{p}"
    if len(p) == 10 and p[0] in '6789':
        return f"+91{p}"
    return f"+91{p}"

@api_router.post("/customer/send-otp")
async def send_otp(req: SendOtpRequest):
    phone = req.phone.strip().replace(" ", "").replace("-", "")
    # Strip +91/91 prefix to store canonical 10-digit
    if phone.startswith('+91'):
        phone = phone[3:]
    elif phone.startswith('91') and len(phone) == 12:
        phone = phone[2:]
    if len(phone) != 10 or phone[0] not in '6789':
        raise HTTPException(400, "Invalid Indian mobile number")

    # Rate limit: max 3 OTPs per phone per 10 minutes
    window_start = datetime.now(timezone.utc) - timedelta(minutes=10)
    recent_count = await db.otp_log.count_documents({"phone": phone, "created_at": {"$gte": window_start}})
    if recent_count >= 3:
        raise HTTPException(429, "Too many OTP requests. Please try again in 10 minutes.")

    otp = ''.join(random.choices(string.digits, k=6))
    await db.otps.delete_many({"phone": phone})
    await db.otps.insert_one({
        "phone": phone, "otp": otp,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
        "attempts": 0,
    })

    otp_mode = os.environ.get('OTP_MODE', 'dev')
    response = {"message": "OTP sent successfully", "expires_in": 300}
    sms_sent = False
    sms_error = None

    if otp_mode == 'production' and twilio_client and _tw_phone:
        try:
            to_phone = _normalize_indian_phone(phone)
            msg = twilio_client.messages.create(
                body=f"{otp} is your Just Ayurveda login OTP. Valid for 5 minutes. Do not share this code with anyone.",
                from_=_tw_phone,
                to=to_phone,
            )
            sms_sent = True
            logging.info(f"OTP SMS sent to {to_phone[:6]}****{to_phone[-2:]} via Twilio SID={msg.sid}")
        except TwilioRestException as e:
            sms_error = f"Twilio error {e.code}: {e.msg}"
            logging.error(sms_error)
        except Exception as e:
            sms_error = f"SMS send failed: {e}"
            logging.error(sms_error)

    # Log every OTP send for rate-limit tracking and audit
    await db.otp_log.insert_one({
        "phone": phone,
        "created_at": datetime.now(timezone.utc),
        "sms_sent": sms_sent,
        "sms_error": sms_error,
        "mode": otp_mode,
    })

    # Fallback to dev mode response if Twilio failed or not in production
    if not sms_sent and otp_mode != 'production':
        response["dev_otp"] = otp
    elif not sms_sent and sms_error:
        # In production, if SMS fails outright (e.g., bad number), raise — don't silently fail
        raise HTTPException(502, "Could not deliver SMS. Please try again or contact support.")

    return response

@api_router.post("/customer/verify-otp")
async def verify_otp(req: VerifyOtpRequest):
    phone = req.phone.strip().replace(" ", "")
    stored = await db.otps.find_one({"phone": phone, "otp": req.otp, "expires_at": {"$gt": datetime.now(timezone.utc)}})
    if not stored:
        raise HTTPException(400, "Invalid or expired OTP")
    await db.otps.delete_many({"phone": phone})
    customer = await db.customers.find_one({"phone": phone})
    is_new = customer is None
    if is_new:
        customer = {"id": str(uuid.uuid4()), "phone": phone, "name": req.name or "", "email": "", "addresses": [], "wishlist": [], "created_at": datetime.now(timezone.utc).isoformat()}
        await db.customers.insert_one(customer)
    cust = await db.customers.find_one({"phone": phone}, {"_id": 0, "password_hash": 0})
    token = create_customer_token(cust['id'], phone=phone, email=cust.get('email', ''))
    return {"token": token, "customer": cust, "is_new": is_new}

@api_router.post("/customer/register-email")
async def register_email(req: EmailRegisterRequest):
    if await db.customers.find_one({"email": req.email.lower()}):
        raise HTTPException(400, "Email already registered")
    doc = {"id": str(uuid.uuid4()), "phone": req.phone, "name": req.name, "email": req.email.lower(), "password_hash": hash_password(req.password), "addresses": [], "wishlist": [], "created_at": datetime.now(timezone.utc).isoformat()}
    await db.customers.insert_one(doc)
    cust = await db.customers.find_one({"id": doc['id']}, {"_id": 0, "password_hash": 0})
    return {"token": create_customer_token(doc['id'], phone=req.phone, email=req.email.lower()), "customer": cust}

@api_router.post("/customer/login-email")
async def login_email(req: EmailLoginRequest):
    customer = await db.customers.find_one({"email": req.email.lower()})
    if not customer or not customer.get('password_hash') or not verify_password(req.password, customer['password_hash']):
        raise HTTPException(401, "Invalid email or password")
    cust = await db.customers.find_one({"id": customer['id']}, {"_id": 0, "password_hash": 0})
    return {"token": create_customer_token(customer['id'], phone=customer.get('phone', ''), email=req.email.lower()), "customer": cust}

@api_router.get("/customer/me")
async def get_customer_profile(customer=Depends(get_current_customer)):
    cust = await db.customers.find_one({"id": customer['sub']}, {"_id": 0, "password_hash": 0})
    if not cust:
        raise HTTPException(404, "Customer not found")
    return cust

@api_router.put("/customer/profile")
async def update_customer_profile(req: ProfileUpdateRequest, customer=Depends(get_current_customer)):
    updates = {}
    if req.name:
        updates['name'] = req.name
    if req.email:
        updates['email'] = req.email.lower()
    if updates:
        await db.customers.update_one({"id": customer['sub']}, {"$set": updates})
    cust = await db.customers.find_one({"id": customer['sub']}, {"_id": 0, "password_hash": 0})
    return cust

@api_router.get("/customer/addresses")
async def get_addresses(customer=Depends(get_current_customer)):
    cust = await db.customers.find_one({"id": customer['sub']}, {"_id": 0})
    return cust.get('addresses', [])

@api_router.post("/customer/addresses")
async def add_address(req: AddressRequest, customer=Depends(get_current_customer)):
    addr = req.model_dump()
    addr['id'] = str(uuid.uuid4())
    cust = await db.customers.find_one({"id": customer['sub']})
    addresses = cust.get('addresses', [])
    if not addresses or req.is_default:
        for a in addresses:
            a['is_default'] = False
        addr['is_default'] = True
    addresses.append(addr)
    await db.customers.update_one({"id": customer['sub']}, {"$set": {"addresses": addresses}})
    return addr

@api_router.put("/customer/addresses/{address_id}")
async def update_address(address_id: str, req: AddressRequest, customer=Depends(get_current_customer)):
    cust = await db.customers.find_one({"id": customer['sub']})
    addresses = cust.get('addresses', [])
    for a in addresses:
        if a['id'] == address_id:
            a.update(req.model_dump())
            a['id'] = address_id
            if req.is_default:
                for o in addresses:
                    o['is_default'] = o['id'] == address_id
            break
    else:
        raise HTTPException(404, "Address not found")
    await db.customers.update_one({"id": customer['sub']}, {"$set": {"addresses": addresses}})
    return next(a for a in addresses if a['id'] == address_id)

@api_router.delete("/customer/addresses/{address_id}")
async def delete_address(address_id: str, customer=Depends(get_current_customer)):
    cust = await db.customers.find_one({"id": customer['sub']})
    addresses = [a for a in cust.get('addresses', []) if a['id'] != address_id]
    if addresses and not any(a.get('is_default') for a in addresses):
        addresses[0]['is_default'] = True
    await db.customers.update_one({"id": customer['sub']}, {"$set": {"addresses": addresses}})
    return {"message": "Address deleted"}

@api_router.put("/customer/addresses/{address_id}/default")
async def set_default_address(address_id: str, customer=Depends(get_current_customer)):
    cust = await db.customers.find_one({"id": customer['sub']})
    addresses = cust.get('addresses', [])
    for a in addresses:
        a['is_default'] = a['id'] == address_id
    await db.customers.update_one({"id": customer['sub']}, {"$set": {"addresses": addresses}})
    return {"message": "Default address updated"}

@api_router.get("/customer/orders")
async def get_customer_orders(customer=Depends(get_current_customer)):
    orders = await db.orders.find({"customer_id": customer['sub']}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return orders

@api_router.post("/customer/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, customer=Depends(get_current_customer)):
    await db.customers.update_one({"id": customer['sub']}, {"$addToSet": {"wishlist": product_id}})
    return {"message": "Added to wishlist"}

@api_router.delete("/customer/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, customer=Depends(get_current_customer)):
    await db.customers.update_one({"id": customer['sub']}, {"$pull": {"wishlist": product_id}})
    return {"message": "Removed from wishlist"}

# ===== SEED DATA =====
SEED_PRODUCTS = [
    {
        "id": "prod-001", "name": "VitalMax Pro Capsules", "slug": "vitalmax-pro-capsules",
        "short_description": "Daily vitality support with Ashwagandha, Safed Musli & Gokshura for natural energy and stamina.",
        "description": "VitalMax Pro is a premium Ayurvedic formulation designed to support men's daily vitality. Crafted with time-tested herbs including KSM-66 Ashwagandha, Safed Musli, and Gokshura, this supplement helps promote natural energy levels, physical endurance, and overall well-being. Each capsule is manufactured in a GMP-certified facility with strict quality standards.",
        "highlights": ["KSM-66 Ashwagandha Extract", "60 Vegetarian Capsules", "GMP Certified Manufacturing"],
        "ingredients": "KSM-66 Ashwagandha Root Extract (600mg), Safed Musli Extract (300mg), Gokshura Extract (250mg), Kaunch Beej Extract (200mg), Black Pepper Extract (10mg) for enhanced absorption.",
        "usage_guide": "Take 2 capsules daily with warm milk or water, preferably after meals. For best results, use consistently for 8-12 weeks. Consult your healthcare provider before starting any supplement regimen.",
        "price": 1499, "original_price": 1999,
        "image": "https://static.prod-images.emergentagent.com/jobs/9174a9c7-fdaa-4d6e-8012-e706aac63019/images/d2d4461c604c199921453d5c2bed97e2fb10e968f1bf2103d2ca1bad60c2a5f1.png",
        "category": "Capsules", "popularity": 95, "created_at": "2026-01-15T10:00:00Z",
        "faqs": [{"question": "How long before I see results?", "answer": "Most users report noticeable improvements in energy and stamina within 4-6 weeks of consistent use."},{"question": "Are there any side effects?", "answer": "VitalMax Pro is made from natural Ayurvedic ingredients and is generally well-tolerated. Consult your doctor if you have pre-existing conditions."},{"question": "Is this suitable for vegetarians?", "answer": "Yes, all capsules are 100% vegetarian."}],
        "reviews": [{"name": "Rahul S.", "rating": 5, "comment": "Excellent product. Noticed a real difference in my energy levels after about a month."},{"name": "Amit K.", "rating": 4, "comment": "Good quality supplement. Packaging was very discreet which I appreciated."},{"name": "Vikram P.", "rating": 5, "comment": "Been using for 3 months now. Very happy with the results."}]
    },
    {
        "id": "prod-002", "name": "Ashwagandha Gold Extract", "slug": "ashwagandha-gold-extract",
        "short_description": "Premium KSM-66 Ashwagandha for stress relief, natural strength, and improved well-being.",
        "description": "Ashwagandha Gold features the clinically studied KSM-66 extract. This adaptogenic herb has been used in Ayurveda for centuries to help the body manage stress, support healthy testosterone levels, and promote natural strength. Our premium formulation ensures maximum bioavailability and potency.",
        "highlights": ["Clinically Studied KSM-66", "90 Capsules (45 Day Supply)", "Stress & Strength Support"],
        "ingredients": "KSM-66 Ashwagandha Root Extract (1000mg), Withania Somnifera standardized to 5% Withanolides, Rice Flour, Vegetarian Capsule Shell (HPMC).",
        "usage_guide": "Take 2 capsules daily with water after breakfast or as directed by your healthcare practitioner.",
        "price": 999, "original_price": 1299,
        "image": "https://static.prod-images.emergentagent.com/jobs/9174a9c7-fdaa-4d6e-8012-e706aac63019/images/ced03eaaec198aa907258bfa6aab090bef0ec81117c87282d124ea6cc728ce53.png",
        "category": "Capsules", "popularity": 88, "created_at": "2026-01-20T10:00:00Z",
        "faqs": [{"question": "What makes KSM-66 different?", "answer": "KSM-66 is a full-spectrum extract retaining all natural constituents in original balance."},{"question": "Can I take this with other supplements?", "answer": "Generally safe to combine. Consult your healthcare provider."},{"question": "Is this third-party tested?", "answer": "Yes, every batch is tested by independent labs."}],
        "reviews": [{"name": "Priya M.", "rating": 5, "comment": "My husband's stress levels have noticeably decreased."},{"name": "Suresh R.", "rating": 4, "comment": "Good quality Ashwagandha. Feels premium."},{"name": "Deepak J.", "rating": 5, "comment": "Sleeping better and feeling more energetic."}]
    },
    {
        "id": "prod-003", "name": "Shilajit Resin Ultra", "slug": "shilajit-resin-ultra",
        "short_description": "Pure Himalayan Shilajit resin for peak performance, recovery, and natural mineral support.",
        "description": "Shilajit Resin Ultra is sourced from the pristine Himalayan mountains at altitudes above 16,000 feet. Rich in fulvic acid and over 84 trace minerals, traditionally used to support energy production, physical performance, and cellular recovery.",
        "highlights": ["Pure Himalayan Source (16,000+ ft)", "Rich in Fulvic Acid & 84+ Minerals", "Lab-Tested for Heavy Metals"],
        "ingredients": "100% Pure Himalayan Shilajit Resin, standardized to minimum 60% Fulvic Acid. No fillers, no additives.",
        "usage_guide": "Dissolve a pea-sized portion (300-500mg) in warm water or milk. Take once daily, preferably in the morning.",
        "price": 2499, "original_price": 3199,
        "image": "https://static.prod-images.emergentagent.com/jobs/9174a9c7-fdaa-4d6e-8012-e706aac63019/images/c705f154984bd8490fdc6c647d885a812948b62d104b671caaf48b145dea5f7e.png",
        "category": "Resin", "popularity": 92, "created_at": "2026-02-01T10:00:00Z",
        "faqs": [{"question": "How do I know this is genuine?", "answer": "Each batch comes with a Certificate of Analysis from an independent lab."},{"question": "What does it taste like?", "answer": "Naturally earthy, slightly bitter. Mix with warm milk and honey."},{"question": "How long does one jar last?", "answer": "One 30g jar typically lasts 45-60 days."}],
        "reviews": [{"name": "Arjun T.", "rating": 5, "comment": "Incredible energy boost. This is the real deal."},{"name": "Manish G.", "rating": 5, "comment": "Best Shilajit I've found. Lab reports gave me confidence."},{"name": "Rajesh N.", "rating": 4, "comment": "Takes getting used to the taste but results speak for themselves."}]
    },
    {
        "id": "prod-004", "name": "Kesar Vigor Oil", "slug": "kesar-vigor-oil",
        "short_description": "Premium Ayurvedic topical wellness oil with Kesar, Jaiphal, and potent herbal extracts.",
        "description": "Kesar Vigor Oil is a carefully crafted topical wellness formulation featuring premium Kesar (Saffron), Jaiphal (Nutmeg), and traditional Ayurvedic herbs in cold-pressed sesame oil base. Supports local circulation and provides a warming, soothing experience.",
        "highlights": ["Premium Kesar & Jaiphal Blend", "Cold-Pressed Sesame Oil Base", "50ml with Dropper Bottle"],
        "ingredients": "Cold-Pressed Sesame Oil, Kesar (Crocus sativus) Extract, Jaiphal (Myristica fragrans) Oil, Ashwagandha Root Oil, Bala Extract, Vitamin E.",
        "usage_guide": "Apply a small amount and massage gently for 5-10 minutes. For external use only. Perform a patch test before first use.",
        "price": 799, "original_price": 999,
        "image": "https://images.unsplash.com/photo-1760888203135-a0f59ea6dea1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHw0fHxncmVlbiUyMGJvdGFuaWNhbCUyMGxlYWYlMjBwbGFudCUyMGFic3RyYWN0JTIwbWFjcm98ZW58MHx8fHwxNzc2MjY5MDI2fDA&ixlib=rb-4.1.0&q=85",
        "category": "Oil", "popularity": 78, "created_at": "2026-02-10T10:00:00Z",
        "faqs": [{"question": "Is this safe for sensitive skin?", "answer": "Do a patch test on inner arm 24 hours before full use."},{"question": "How long does one bottle last?", "answer": "50ml typically lasts 4-6 weeks."}],
        "reviews": [{"name": "Karan D.", "rating": 4, "comment": "Nice quality oil. Subtle saffron fragrance."},{"name": "Nikhil V.", "rating": 5, "comment": "Premium feel. Dropper bottle is convenient."}]
    },
    {
        "id": "prod-005", "name": "Endurance Elixir Tonic", "slug": "endurance-elixir-tonic",
        "short_description": "Daily herbal wellness tonic for sustained energy, confidence, and overall male vitality.",
        "description": "Endurance Elixir is a potent liquid Ayurvedic formulation combining powerful adaptogens and rejuvenating herbs in a convenient daily tonic. Featuring Shatavari, Ashwagandha, Safed Musli, and Amla in a honey-based syrup.",
        "highlights": ["Honey-Based Liquid Formula", "Fast Absorption & Easy to Take", "500ml Bottle (30 Day Supply)"],
        "ingredients": "Honey Base, Shatavari Extract, Ashwagandha Extract, Safed Musli Extract, Amla Extract, Gokshura Extract, Pippali Extract.",
        "usage_guide": "Take 15ml (1 tablespoon) twice daily with warm milk or water. Shake well before use. Refrigerate after opening.",
        "price": 1799, "original_price": 2299,
        "image": "https://images.unsplash.com/photo-1773294179744-c31bab5410fc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHxncmVlbiUyMGJvdGFuaWNhbCUyMGxlYWYlMjBwbGFudCUyMGFic3RyYWN0JTIwbWFjcm98ZW58MHx8fHwxNzc2MjY5MDI2fDA&ixlib=rb-4.1.0&q=85",
        "category": "Tonic", "popularity": 85, "created_at": "2026-02-15T10:00:00Z",
        "faqs": [{"question": "Does it need refrigeration?", "answer": "Refrigerate after opening. Unopened bottles store in a cool, dry place."},{"question": "What does it taste like?", "answer": "Pleasant, mildly sweet with subtle herbal notes from the honey base."}],
        "reviews": [{"name": "Ankit S.", "rating": 5, "comment": "Love the taste and convenience."},{"name": "Rohit B.", "rating": 4, "comment": "Noticeable improvement in energy levels."},{"name": "Vivek C.", "rating": 5, "comment": "Best Ayurvedic tonic I've tried."}]
    }
]

async def seed_admin():
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@justayurveda.in').lower()
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    existing = await db.admin_users.find_one({"email": admin_email})
    if not existing:
        await db.admin_users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password), "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})
        logging.info("Admin user seeded")
    elif not verify_password(admin_password, existing['password_hash']):
        await db.admin_users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logging.info("Admin password updated")

async def seed_products():
    count = await db.products.count_documents({})
    if count == 0:
        for p in SEED_PRODUCTS:
            await db.products.insert_one(p)
        logging.info("Seeded 5 products")

async def backfill_product_images():
    """Ensure every product has an `images` array (mirrored from `image`)."""
    cursor = db.products.find({"images": {"$exists": False}})
    async for p in cursor:
        imgs = [{"url": p["image"], "isPrimary": True}] if p.get("image") else []
        await db.products.update_one({"_id": p["_id"]}, {"$set": {"images": imgs}})

@app.on_event("startup")
async def startup():
    await seed_admin()
    await seed_products()
    await backfill_product_images()
    try:
        init_storage()
        logging.info("Object storage initialized")
    except Exception as e:
        logging.error(f"Object storage init failed: {e}")
    await db.admin_users.create_index("email", unique=True)
    await db.otps.create_index("expires_at", expireAfterSeconds=0)
    # Auto-delete OTP audit logs after 24h
    try:
        await db.otp_log.create_index("created_at", expireAfterSeconds=86400)
    except Exception:
        pass
    try:
        await db.customers.create_index("phone", unique=True, sparse=True)
        await db.customers.create_index("email", sparse=True)
    except Exception as e:
        logging.warning(f"Index creation warning (safe to ignore if indexes exist): {e}")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
