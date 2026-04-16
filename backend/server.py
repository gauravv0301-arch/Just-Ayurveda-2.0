from fastapi import FastAPI, APIRouter, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class ProductFAQ(BaseModel):
    question: str
    answer: str

class ProductReview(BaseModel):
    name: str
    rating: int
    comment: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    short_description: str
    description: str
    highlights: List[str]
    ingredients: str
    usage_guide: str
    price: float
    original_price: float
    image: str
    category: str
    popularity: int
    created_at: str
    faqs: List[ProductFAQ]
    reviews: List[ProductReview]

SEED_PRODUCTS = [
    {
        "id": "prod-001",
        "name": "VitalMax Pro Capsules",
        "slug": "vitalmax-pro-capsules",
        "short_description": "Daily vitality support with Ashwagandha, Safed Musli & Gokshura for natural energy and stamina.",
        "description": "VitalMax Pro is a premium Ayurvedic formulation designed to support men's daily vitality. Crafted with time-tested herbs including KSM-66 Ashwagandha, Safed Musli, and Gokshura, this supplement helps promote natural energy levels, physical endurance, and overall well-being. Each capsule is manufactured in a GMP-certified facility with strict quality standards.",
        "highlights": ["KSM-66 Ashwagandha Extract", "60 Vegetarian Capsules", "GMP Certified Manufacturing"],
        "ingredients": "KSM-66 Ashwagandha Root Extract (600mg), Safed Musli Extract (300mg), Gokshura Extract (250mg), Kaunch Beej Extract (200mg), Black Pepper Extract (10mg) for enhanced absorption.",
        "usage_guide": "Take 2 capsules daily with warm milk or water, preferably after meals. For best results, use consistently for 8-12 weeks. Consult your healthcare provider before starting any supplement regimen.",
        "price": 1499,
        "original_price": 1999,
        "image": "https://static.prod-images.emergentagent.com/jobs/9174a9c7-fdaa-4d6e-8012-e706aac63019/images/d2d4461c604c199921453d5c2bed97e2fb10e968f1bf2103d2ca1bad60c2a5f1.png",
        "category": "Capsules",
        "popularity": 95,
        "created_at": "2026-01-15T10:00:00Z",
        "faqs": [
            {"question": "How long before I see results?", "answer": "Most users report noticeable improvements in energy and stamina within 4-6 weeks of consistent use."},
            {"question": "Are there any side effects?", "answer": "VitalMax Pro is made from natural Ayurvedic ingredients and is generally well-tolerated. However, consult your doctor if you have any pre-existing conditions."},
            {"question": "Is this suitable for vegetarians?", "answer": "Yes, all capsules are 100% vegetarian and made without any animal-derived ingredients."}
        ],
        "reviews": [
            {"name": "Rahul S.", "rating": 5, "comment": "Excellent product. Noticed a real difference in my energy levels after about a month."},
            {"name": "Amit K.", "rating": 4, "comment": "Good quality supplement. Packaging was very discreet which I appreciated."},
            {"name": "Vikram P.", "rating": 5, "comment": "Been using for 3 months now. Very happy with the results. Will continue ordering."}
        ]
    },
    {
        "id": "prod-002",
        "name": "Ashwagandha Gold Extract",
        "slug": "ashwagandha-gold-extract",
        "short_description": "Premium KSM-66 Ashwagandha for stress relief, natural strength, and improved well-being.",
        "description": "Ashwagandha Gold features the clinically studied KSM-66 extract, the world's most researched Ashwagandha. This adaptogenic herb has been used in Ayurveda for centuries to help the body manage stress, support healthy testosterone levels, and promote natural strength. Our premium formulation ensures maximum bioavailability and potency.",
        "highlights": ["Clinically Studied KSM-66", "90 Capsules (45 Day Supply)", "Stress & Strength Support"],
        "ingredients": "KSM-66 Ashwagandha Root Extract (1000mg), Withania Somnifera standardized to 5% Withanolides, Rice Flour, Vegetarian Capsule Shell (HPMC).",
        "usage_guide": "Take 2 capsules daily with water after breakfast or as directed by your healthcare practitioner. Consistency is key for optimal results.",
        "price": 999,
        "original_price": 1299,
        "image": "https://static.prod-images.emergentagent.com/jobs/9174a9c7-fdaa-4d6e-8012-e706aac63019/images/ced03eaaec198aa907258bfa6aab090bef0ec81117c87282d124ea6cc728ce53.png",
        "category": "Capsules",
        "popularity": 88,
        "created_at": "2026-01-20T10:00:00Z",
        "faqs": [
            {"question": "What makes KSM-66 different?", "answer": "KSM-66 is a full-spectrum extract produced using a unique process that retains all the natural constituents of the root in the original balance."},
            {"question": "Can I take this with other supplements?", "answer": "Ashwagandha Gold is generally safe to combine with other supplements. However, we recommend consulting your healthcare provider."},
            {"question": "Is this third-party tested?", "answer": "Yes, every batch is tested by independent labs for purity, potency, and heavy metals."}
        ],
        "reviews": [
            {"name": "Priya M.", "rating": 5, "comment": "My husband has been using this and his stress levels have noticeably decreased."},
            {"name": "Suresh R.", "rating": 4, "comment": "Good quality Ashwagandha. Feels premium compared to other brands I've tried."},
            {"name": "Deepak J.", "rating": 5, "comment": "Sleeping better and feeling more energetic during the day. Great product."}
        ]
    },
    {
        "id": "prod-003",
        "name": "Shilajit Resin Ultra",
        "slug": "shilajit-resin-ultra",
        "short_description": "Pure Himalayan Shilajit resin for peak performance, recovery, and natural mineral support.",
        "description": "Shilajit Resin Ultra is sourced from the pristine Himalayan mountains at altitudes above 16,000 feet. This potent adaptogenic resin is rich in fulvic acid and over 84 trace minerals, traditionally used to support energy production, physical performance, and cellular recovery. Each batch is lab-tested for purity and potency.",
        "highlights": ["Pure Himalayan Source (16,000+ ft)", "Rich in Fulvic Acid & 84+ Minerals", "Lab-Tested for Heavy Metals"],
        "ingredients": "100% Pure Himalayan Shilajit Resin, standardized to minimum 60% Fulvic Acid. No fillers, no additives, no preservatives.",
        "usage_guide": "Dissolve a pea-sized portion (300-500mg) in warm water or milk. Take once daily, preferably in the morning on an empty stomach. Use the included measuring spoon for accurate dosing.",
        "price": 2499,
        "original_price": 3199,
        "image": "https://static.prod-images.emergentagent.com/jobs/9174a9c7-fdaa-4d6e-8012-e706aac63019/images/c705f154984bd8490fdc6c647d885a812948b62d104b671caaf48b145dea5f7e.png",
        "category": "Resin",
        "popularity": 92,
        "created_at": "2026-02-01T10:00:00Z",
        "faqs": [
            {"question": "How do I know this is genuine Shilajit?", "answer": "Our Shilajit is sourced directly from the Himalayas and each batch comes with a Certificate of Analysis from an independent lab."},
            {"question": "What does it taste like?", "answer": "Shilajit has a naturally earthy, slightly bitter taste. Mixing with warm milk and honey makes it more palatable."},
            {"question": "How long does one jar last?", "answer": "One 30g jar typically lasts 45-60 days with regular use as directed."}
        ],
        "reviews": [
            {"name": "Arjun T.", "rating": 5, "comment": "Incredible energy boost. This is the real deal - you can taste the quality."},
            {"name": "Manish G.", "rating": 5, "comment": "Best Shilajit I've found. Lab reports gave me confidence in the purity."},
            {"name": "Rajesh N.", "rating": 4, "comment": "Takes some getting used to the taste but the results speak for themselves."}
        ]
    },
    {
        "id": "prod-004",
        "name": "Kesar Vigor Oil",
        "slug": "kesar-vigor-oil",
        "short_description": "Premium Ayurvedic topical wellness oil with Kesar, Jaiphal, and potent herbal extracts.",
        "description": "Kesar Vigor Oil is a carefully crafted topical wellness formulation featuring premium Kesar (Saffron), Jaiphal (Nutmeg), and a blend of traditional Ayurvedic herbs in a base of cold-pressed sesame oil. This time-honored formulation supports local circulation and provides a warming, soothing experience. Designed for external use as part of your daily wellness routine.",
        "highlights": ["Premium Kesar & Jaiphal Blend", "Cold-Pressed Sesame Oil Base", "50ml with Dropper Bottle"],
        "ingredients": "Cold-Pressed Sesame Oil, Kesar (Crocus sativus) Extract, Jaiphal (Myristica fragrans) Oil, Ashwagandha (Withania somnifera) Root Oil, Bala (Sida cordifolia) Extract, Vitamin E.",
        "usage_guide": "Apply a small amount to the desired area and massage gently for 5-10 minutes. For best results, use before bedtime. For external use only. Perform a patch test before first use.",
        "price": 799,
        "original_price": 999,
        "image": "https://images.unsplash.com/photo-1760888203135-a0f59ea6dea1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHw0fHxncmVlbiUyMGJvdGFuaWNhbCUyMGxlYWYlMjBwbGFudCUyMGFic3RyYWN0JTIwbWFjcm98ZW58MHx8fHwxNzc2MjY5MDI2fDA&ixlib=rb-4.1.0&q=85",
        "category": "Oil",
        "popularity": 78,
        "created_at": "2026-02-10T10:00:00Z",
        "faqs": [
            {"question": "Is this safe for sensitive skin?", "answer": "The oil is formulated with natural ingredients. However, we recommend doing a small patch test on your inner arm 24 hours before full use."},
            {"question": "How long does one bottle last?", "answer": "A 50ml bottle typically lasts 4-6 weeks with regular use."},
            {"question": "Can I use this with other products?", "answer": "Yes, this oil can be used as part of your regular wellness routine. For external use only."}
        ],
        "reviews": [
            {"name": "Karan D.", "rating": 4, "comment": "Nice quality oil. The saffron fragrance is subtle and pleasant."},
            {"name": "Nikhil V.", "rating": 5, "comment": "Premium feel to the product. The dropper bottle is very convenient."},
            {"name": "Sanjay M.", "rating": 4, "comment": "Good product, discreet packaging. Would recommend."}
        ]
    },
    {
        "id": "prod-005",
        "name": "Endurance Elixir Tonic",
        "slug": "endurance-elixir-tonic",
        "short_description": "Daily herbal wellness tonic for sustained energy, confidence, and overall male vitality.",
        "description": "Endurance Elixir is a potent liquid Ayurvedic formulation combining powerful adaptogens and rejuvenating herbs in a convenient daily tonic. Featuring Shatavari, Ashwagandha, Safed Musli, and Amla in a honey-based syrup, this elixir supports sustained energy, healthy stamina, and overall vitality. Easy to consume and fast-absorbing for daily wellness support.",
        "highlights": ["Honey-Based Liquid Formula", "Fast Absorption & Easy to Take", "500ml Bottle (30 Day Supply)"],
        "ingredients": "Honey Base, Shatavari (Asparagus racemosus) Extract, Ashwagandha (Withania somnifera) Extract, Safed Musli (Chlorophytum borivilianum) Extract, Amla (Emblica officinalis) Extract, Gokshura (Tribulus terrestris) Extract, Pippali (Piper longum) Extract.",
        "usage_guide": "Take 15ml (1 tablespoon) twice daily with warm milk or water. Best consumed after meals. Shake well before use. Refrigerate after opening.",
        "price": 1799,
        "original_price": 2299,
        "image": "https://images.unsplash.com/photo-1773294179744-c31bab5410fc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwyfHxncmVlbiUyMGJvdGFuaWNhbCUyMGxlYWYlMjBwbGFudCUyMGFic3RyYWN0JTIwbWFjcm98ZW58MHx8fHwxNzc2MjY5MDI2fDA&ixlib=rb-4.1.0&q=85",
        "category": "Tonic",
        "popularity": 85,
        "created_at": "2026-02-15T10:00:00Z",
        "faqs": [
            {"question": "Does it need to be refrigerated?", "answer": "Refrigerate after opening to maintain freshness. Unopened bottles can be stored in a cool, dry place."},
            {"question": "What does it taste like?", "answer": "The honey base gives it a pleasant, mildly sweet taste with subtle herbal notes. Most users find it quite palatable."},
            {"question": "Can women take this too?", "answer": "While formulated for men's wellness, the herbs are generally safe. Women should consult their healthcare provider before use."}
        ],
        "reviews": [
            {"name": "Ankit S.", "rating": 5, "comment": "Love the taste and convenience. Much easier than taking multiple capsules."},
            {"name": "Rohit B.", "rating": 4, "comment": "Noticeable improvement in energy levels. The honey base makes it easy to take daily."},
            {"name": "Vivek C.", "rating": 5, "comment": "Best Ayurvedic tonic I've tried. The quality is evident from the first sip."}
        ]
    }
]

async def seed_products():
    count = await db.products.count_documents({})
    if count == 0:
        for product in SEED_PRODUCTS:
            await db.products.insert_one(product)
        logging.info("Seeded 5 products into database")
    else:
        logging.info(f"Products collection already has {count} documents, skipping seed")

@app.on_event("startup")
async def startup():
    await seed_products()

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

    sort_field = "popularity"
    sort_order = -1
    if sort == "price_low":
        sort_field = "price"
        sort_order = 1
    elif sort == "price_high":
        sort_field = "price"
        sort_order = -1
    elif sort == "newest":
        sort_field = "created_at"
        sort_order = -1
    elif sort == "popularity":
        sort_field = "popularity"
        sort_order = -1

    products = await db.products.find(query, {"_id": 0}).sort(sort_field, sort_order).to_list(100)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    return product

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
