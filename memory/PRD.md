# Just Ayurveda — PRD & Project Memory

## Original Problem Statement
Premium e-commerce website for "Just Ayurveda" — men's Ayurvedic wellness brand. Customer storefront + admin panel. Live integrations: Razorpay payments, Twilio SMS OTP, Emergent Object Storage for product media, 3D Three.js hero.

## Architecture
- **Frontend**: React (CRA) + Tailwind + Shadcn UI + Framer Motion + Three.js + @dnd-kit
- **Backend**: FastAPI + MongoDB (Motor) + Razorpay SDK + Twilio SDK + Emergent Object Storage
- **DB**: MongoDB (products, admin_users, customers, orders, coupons, otps, otp_log, files, webhook_events, contact_messages)
- **Auth**: JWT — admin (email/password) + customer (phone OTP via Twilio / email-password)
- **Payments**: Razorpay LIVE mode + signed webhooks
- **Storage**: Emergent Object Storage (EMERGENT_LLM_KEY)

## Features Implemented

### Customer
- [x] Routes: Home, Products, Detail, About, Contact, FAQ, Checkout, Order Success/Failure, Auth, Account, Certifications
- [x] Cart (CartContext + localStorage)
- [x] Razorpay LIVE checkout + signature verification
- [x] Coupons (CRUD + validation + auto usage increment)
- [x] Wishlist (logged-in DB sync)
- [x] Address book (CRUD, default, pincode auto-detect)
- [x] Customer OTP auth via Twilio SMS (real prod SMS, rate-limited 3/10min)
- [x] Three.js 3D hero scene
- [x] Certifications page with PDF viewer
- [x] Portrait product image layouts (object-contain, 3:4 cards / 4:5 detail)

### Admin
- [x] Product CRUD with multi-image gallery (drag-and-drop reorder via @dnd-kit, max 5 images, primary star, JPG/PNG/WEBP, 5MB)
- [x] Orders viewer (status, coupon, customer)
- [x] Users (search, block/unblock, view orders + addresses)
- [x] Coupons CRUD

### Infrastructure
- [x] `/api/health` for k8s readiness
- [x] White-labeled (no Emergent branding)
- [x] Emergent Object Storage for product media
- [x] Twilio real SMS OTP integration with rate limit + audit log (TTL 24h)
- [x] Razorpay LIVE keys + signed webhook `/api/razorpay/webhook` (HMAC SHA256, idempotent via event_id)

## Credentials
- See `/app/memory/test_credentials.md`
- Admin: `admin@justayurveda.in` / `admin123`
- Razorpay: LIVE (`rzp_live_SraPjUJJIZAA6I`) — real money
- Twilio: trial account (sends only to verified numbers)
- Webhook secret: stored in `RAZORPAY_WEBHOOK_SECRET` env var

## Testing
- Backend pytest: 100% (13/13 in iteration 8, plus 12/12 in iteration 7)
- Frontend: admin + customer flows verified via testing agent (iteration 8)
- Test reports: `/app/test_reports/iteration_8.json` (latest)
- Test files: `/app/backend/tests/test_iter8_prod_hardening.py`, `/app/backend/tests/test_multi_image_upload.py`

## Manual Steps Required (User)
1. **Add Razorpay webhook in dashboard**:
   - URL: `https://justayurveda.life/api/razorpay/webhook`
   - Secret: `whsec_ja_1b77f0b78873d838191d666a990089a679228c83`
   - Events: `payment.captured`, `payment.failed`
2. **Upgrade Twilio from trial** (or verify Indian numbers in Twilio Console → Phone Numbers → Verified Caller IDs) to send SMS to arbitrary numbers
3. **Redeploy to production** to push these env vars to `justayurveda.life`

## Backlog
- **P2**: Refactor `server.py` (~960 lines) into modular `backend/routes/` + `backend/models/`
- **P2**: Customer review submission form (currently seed-only reviews)
- **P2**: Refund flow + COD hybrid + Razorpay subscriptions
- **P2**: Blog / Articles section
- **P2**: Multi-language EN/HI
- **P3**: Admin coupon analytics dashboard (redemption rate, revenue impact)
- **P3**: Server-Sent Events / WebSocket for live order status

## Recent Changes (May 2026)
- Razorpay switched to **LIVE** mode (`rzp_live_*`) + webhook endpoint
- Twilio SMS OTP wired (replaces dev_otp) with rate limiting
- Drag-and-drop image reordering in admin via @dnd-kit/sortable
- Portrait image layout pass across all product views
- Multi-image product gallery (admin uploader + customer ImageGallery)
- Emergent Object Storage integration

## Recent Changes (Feb 2026)
- Multi-image gallery system end-to-end
- White-labeling completed
- Customer accounts + wishlist + coupons + addresses
- Certifications page with PDF viewer
