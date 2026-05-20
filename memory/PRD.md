# Just Ayurveda — PRD & Project Memory

## Original Problem Statement
Premium e-commerce + content platform for "Just Ayurveda" — men's Ayurvedic wellness brand. Customer storefront + admin panel + blog. Live integrations: Razorpay payments + webhooks, Twilio SMS OTP, Emergent Object Storage. Bilingual EN/HI.

## Architecture
- **Frontend**: React (CRA) + Tailwind + Shadcn UI + Framer Motion + Three.js + @dnd-kit + i18next + react-markdown
- **Backend**: FastAPI + MongoDB (Motor) + Razorpay SDK + Twilio SDK + Emergent Object Storage
- **DB collections**: products, admin_users, customers, orders, coupons, reviews, blog_posts, otps, otp_log, files, webhook_events, contact_messages
- **Auth**: JWT — admin (email/password) + customer (phone OTP via Twilio / email-password)
- **Payments**: Razorpay LIVE mode + signed webhooks (HMAC SHA256, idempotent)
- **Storage**: Emergent Object Storage (EMERGENT_LLM_KEY)
- **i18n**: react-i18next, localStorage key `ja_lang`, languages `en` + `hi`

## Features Implemented

### Customer
- [x] Routes: Home, Products, Detail, About, Contact, FAQ, Checkout, Order Success/Failure, Auth, Account, Certifications, **Blog list**, **Blog post**
- [x] Cart + Razorpay LIVE checkout + signature verification + webhook sync
- [x] Coupons (CRUD + validation + auto usage increment + analytics)
- [x] Wishlist (logged-in DB sync)
- [x] Address book (CRUD, default, pincode auto-detect)
- [x] Phone OTP auth via Twilio LIVE SMS (rate-limited 3/10min, expires 5min)
- [x] **Customer reviews** — submit form on detail page (1-5 stars + name + title + comment), legacy + new combined display, verified-purchase badge, moderation note
- [x] Three.js 3D hero scene
- [x] Certifications page with PDF viewer
- [x] Portrait product image layouts (object-contain, 3:4 cards / 4:5 detail)
- [x] **Blog**: featured + grid listing, tag filter + search, markdown content with prose styling, related articles, SEO meta tags per post
- [x] **i18n**: navbar/footer/key buttons translate EN↔HI, language toggle in navbar (with Globe icon)

### Admin (7 tabs)
- [x] **Products**: CRUD + multi-image drag-and-drop gallery + **"How to Use" markdown field** (data-testid=product-form-usage)
- [x] **Orders**: viewer with status, coupon, customer
- [x] **Users**: search, block/unblock, view orders + addresses
- [x] **Coupons**: CRUD + status badges
- [x] **Reviews** (NEW): filter by status (all/pending/approved/rejected), approve/reject/feature/delete, shows verified-purchase + featured badges
- [x] **Blog** (NEW): list + create/edit modal with title/slug/excerpt/content/featured_image/tags/seo/status, markdown content, draft↔published workflow
- [x] **Analytics** (NEW): 7/30/90/365-day windows · 4 metric cards (total coupons, redemptions, revenue, discount) · daily redemption sparkline chart · top 5 coupons leaderboard

### Infrastructure
- [x] `/api/health` for k8s readiness
- [x] White-labeled (no Emergent branding)
- [x] Emergent Object Storage for product media + blog featured images
- [x] Razorpay webhook with idempotency
- [x] OTP audit log with 24h TTL auto-purge

## Credentials
- See `/app/memory/test_credentials.md`
- Admin: `admin@justayurveda.in` / `admin123`
- Razorpay: LIVE (`rzp_live_SraPjUJJIZAA6I`)
- Webhook secret: `whsec_ja_1b77f0b78873d838191d666a990089a679228c83`
- Twilio: trial (verified-numbers only)

## Testing
- Backend pytest: 100% (24/24 in iteration 9, 13/13 iter 8, 12/12 iter 7)
- Frontend: admin 7 tabs + customer reviews + blog + language toggle all green (iter 9)
- Test reports: `/app/test_reports/iteration_9.json` (latest)
- Test files: `/app/backend/tests/test_iter9_reviews_blog_analytics.py`, `test_iter8_prod_hardening.py`, `test_multi_image_upload.py`

## Manual Steps Required (User)
1. **Razorpay Dashboard → Settings → Webhooks**: add URL `https://justayurveda.life/api/razorpay/webhook` with secret `whsec_ja_1b77f0b78873d838191d666a990089a679228c83`, events `payment.captured` + `payment.failed`
2. **Twilio**: upgrade from trial OR verify each test phone in Twilio Console → Phone Numbers → Verified Caller IDs
3. **Hindi content**: i18n foundation is set up (navbar + footer + buttons translate). **Product copy, FAQ answers, blog content** need human-written Hindi versions — currently they stay in English even when language is toggled. Recommend hiring a Hindi copywriter for a one-time content translation pass.
4. **Redeploy** to push all changes (incl. env vars) to production `justayurveda.life`

## Backlog
- **P2** Refactor `server.py` (~1100 lines) into modular `backend/routes/` + `backend/models/`
- **P2** Refund flow + COD hybrid + Razorpay subscription support
- **P2** Photo upload in customer review form
- **P2** Rich-text WYSIWYG for blog content editor (currently markdown textarea)
- **P2** Bilingual product/blog content storage (en/hi field pairs in MongoDB)
- **P3** Blog SEO sitemap.xml + hreflang tags
- **P3** Server-Sent Events for live order status

## Recent Changes (May 2026)
- 5-feature mega batch: How-to-Use admin editor + customer reviews + coupon analytics + blog MVP + EN/HI i18n foundation
- Razorpay LIVE mode + signed webhook with idempotency
- Twilio SMS OTP integration with rate limiting
- Drag-and-drop admin image reordering via @dnd-kit
- Portrait image layout pass
- Multi-image product gallery
- Emergent Object Storage integration
