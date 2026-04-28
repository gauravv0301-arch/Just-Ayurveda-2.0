from fastapi import FastAPI, APIRouter, Query, HTTPException, Depends
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
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
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

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str

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
    doc['id'] = f"prod-{str(uuid.uuid4())[:8]}"
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(doc)
    created = await db.products.find_one({"id": doc['id']}, {"_id": 0})
    return created

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, product: ProductCreateRequest, admin=Depends(get_current_admin)):
    doc = product.model_dump()
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

# ===== ORDER ENDPOINTS =====
@api_router.post("/orders/create")
async def create_order(req: OrderCreateRequest, customer=Depends(get_optional_customer)):
    product = await db.products.find_one({"id": req.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Product not found")
    amount = int(product['price'] * req.quantity * 100)
    order_id = f"JA-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"
    razorpay_order_id = None
    if razorpay_client:
        try:
            rzp_order = razorpay_client.order.create({"amount": amount, "currency": "INR", "receipt": order_id[:40], "payment_capture": 1})
            razorpay_order_id = rzp_order['id']
        except Exception as e:
            logging.error(f"Razorpay error: {e}")
            raise HTTPException(400, f"Payment initialization failed. Please ensure Razorpay keys are configured correctly.")
    else:
        raise HTTPException(400, "Payment gateway not configured. Add valid Razorpay API keys to backend .env")
    order = {
        "id": order_id, "product_id": product['id'], "product_name": product['name'],
        "product_image": product.get('image', ''), "quantity": req.quantity,
        "amount": product['price'] * req.quantity, "amount_paise": amount,
        "customer_name": req.customer_name, "customer_email": req.customer_email,
        "customer_phone": req.customer_phone, "customer_address": req.customer_address,
        "razorpay_order_id": razorpay_order_id, "razorpay_payment_id": None,
        "razorpay_signature": None, "status": "pending",
        "customer_id": customer['sub'] if customer else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)
    return {"order_id": order_id, "razorpay_order_id": razorpay_order_id, "amount": amount, "currency": "INR", "product_name": product['name']}

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

@api_router.get("/admin/orders")
async def get_all_orders(admin=Depends(get_current_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

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

@api_router.post("/customer/send-otp")
async def send_otp(req: SendOtpRequest):
    phone = req.phone.strip().replace(" ", "")
    if len(phone) < 10:
        raise HTTPException(400, "Invalid phone number")
    otp = ''.join(random.choices(string.digits, k=6))
    await db.otps.delete_many({"phone": phone})
    await db.otps.insert_one({"phone": phone, "otp": otp, "created_at": datetime.now(timezone.utc), "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)})
    return {"message": "OTP sent successfully", "dev_otp": otp}

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

@app.on_event("startup")
async def startup():
    await seed_admin()
    await seed_products()
    await db.admin_users.create_index("email", unique=True)

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
