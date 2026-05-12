# Just Ayurveda — PRD & Project Memory

## Original Problem Statement
Premium e-commerce website for "Just Ayurveda" — men's Ayurvedic wellness brand. Customer-facing storefront (Home, Products, Detail, About, Contact, FAQ, Checkout, Certifications, Auth/Account) + Admin panel (Products, Orders, Users, Coupons). Integrations: Razorpay payments, 3D Three.js hero, Emergent Object Storage for product media.

## Architecture
- **Frontend**: React (CRA) + Tailwind CSS + Shadcn UI + Framer Motion + Three.js
- **Backend**: FastAPI + MongoDB (Motor) + Razorpay SDK + Emergent Object Storage
- **DB**: MongoDB (products, admin_users, customers, orders, coupons, otps, contact_messages, files)
- **Auth**: JWT — admin (email/password) + customer (phone OTP / email-password)
- **Payments**: Razorpay (test mode)
- **Storage**: Emergent Object Storage (uses EMERGENT_LLM_KEY)

## Features Implemented
- [x] Multi-page routing (Home, Products, Detail, About, Contact, FAQ, Checkout, Order Success/Failure, Auth, Account, Certifications, Admin login/dashboard)
- [x] Product Quick View Modal with 3 CTAs (Add to Cart / Buy Now / View Details)
- [x] Cart system (CartContext + localStorage)
- [x] Razorpay checkout with coupon code validation + discount
- [x] Customer OTP auth (dev_otp returned in dev mode) + email/password fallback
- [x] Address book (CRUD, default selection, pincode auto-detect)
- [x] Wishlist (synced when logged in)
- [x] Admin: Products + Orders + Users (block/unblock) + Coupons CRUD
- [x] Three.js 3D hero scene
- [x] Certifications page with PDF viewer + download
- [x] White-labeled (no Emergent branding)
- [x] `/api/health` for k8s readiness
- [x] **Multi-image product galleries (NEW — Feb 2026)**
  - Backend: `POST /api/admin/upload` (multipart, multi-file, MIME + 5MB validation), `GET /api/files/{path}` public serve, Emergent Object Storage integration
  - Product schema: `images: [{url, isPrimary}]` array; legacy `image` field auto-synced to primary URL on save
  - Backfill on startup: legacy single-image products converted to `images` array
  - Admin: `MultiImageUploader` (drag & drop, multi-pick, thumbnails, set primary, delete, reorder via arrows, max 5 images, progress indicator)
  - Customer: `ImageGallery` on ProductDetailPage (full size, prev/next, thumbnails, hover-zoom) and ProductQuickView (compact carousel, mobile swipe)
  - Backward compatibility: old products with only `image` still render via `getPrimaryImage`/`resolveImageUrl` helpers

## Credentials
- Admin: `admin@justayurveda.in` / `admin123` (see `/app/memory/test_credentials.md`)
- Razorpay test keys in `/app/backend/.env`
- `EMERGENT_LLM_KEY` set in `/app/backend/.env` for object storage

## Testing
- Backend: 100% (12/12 tests for upload + serve + product schema + backfill in iteration 7)
- Frontend: 100% on admin upload UI + customer gallery flows (iteration 7)
- Test file: `/app/backend/tests/test_multi_image_upload.py`
- Latest report: `/app/test_reports/iteration_7.json`

## Backlog
- **P1**: Real SMS provider (Twilio/MSG91) integration to replace `dev_otp` in `send_otp` endpoint
- **P1**: Real Razorpay live keys + GA4 production ID
- **P2**: Refactor `server.py` (820+ lines) into modular `backend/routes/`, `backend/models/` structure
- **P2**: Drag-and-drop reordering of admin images (currently uses arrow buttons)
- **P2**: Customer review submission form
- **P2**: Blog / Articles section
- **P2**: Multi-language support (EN/HI)

## Recent Changes (Feb 12, 2026)
- Implemented multi-image gallery system end-to-end (admin upload + customer carousel)
- Added Emergent Object Storage integration (storage helpers in `server.py`)
- Added `MultiImageUploader.js`, `ImageGallery.js`, `lib/images.js` (helper utils)
- Updated `ProductCard`, `ProductQuickView`, `ProductDetailPage`, `CheckoutPage`, `AccountPage` to use new image helpers
- Auto-backfill on startup for existing seed products
