# Just Ayurveda — PRD & Project Memory

## Original Problem Statement
Build a premium e-commerce website for "Just Ayurveda" — an age-gated men's Ayurvedic wellness brand. WhatsApp-first ordering model with discreet, professional tone.

## Architecture
- **Frontend**: React (CRA) + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Database**: MongoDB with `products` collection (5 seeded products)
- **Deployment**: Kubernetes container (supervisor-managed)

## User Personas
- **Primary**: Men aged 25-45 seeking Ayurvedic wellness supplements
- **Secondary**: Partners/spouses buying on behalf

## Core Requirements
- [x] Age gate (18+) popup on first visit
- [x] Hero section with animated gradient blob, CTAs
- [x] Trust badges (Discreet Packaging, Fast Support, Secure Ordering)
- [x] 5 product cards with images, prices, highlights, discount badges
- [x] Product detail modal (description, ingredients, usage, FAQ, reviews)
- [x] WhatsApp integration (pre-filled messages, floating button)
- [x] Sort (popularity, price, newest) & category filter
- [x] Search functionality
- [x] Benefits section (6 benefits)
- [x] FAQ accordion (7 questions)
- [x] Contact section with WhatsApp CTA + store details
- [x] Footer with disclaimer, quick links, WhatsApp CTA
- [x] Sticky glassmorphism navbar with logo
- [x] Mobile-responsive (Sheet menu, sticky mobile CTAs)
- [x] Scroll-reveal animations (IntersectionObserver + MutationObserver)
- [x] Skeleton loading states for product cards
- [x] Toast notifications (Sonner)

## What's Been Implemented (April 15, 2026)
- Full backend API: GET /api/products, GET /api/products/{id}, search/sort/filter
- 5 seeded products: VitalMax Pro, Ashwagandha Gold, Shilajit Resin Ultra, Kesar Vigor Oil, Endurance Elixir Tonic
- Complete frontend with 12 components, 1 custom hook
- Brand color system: #233232, #3bb44b, #61a06c, #8dac96, #cfecd6, #edfbf0
- Fonts: Outfit (headings), Plus Jakarta Sans (body)
- Testing: 100% backend, 95% frontend

## Product Data
| ID | Name | Price | Category |
|----|------|-------|----------|
| prod-001 | VitalMax Pro Capsules | ₹1,499 | Capsules |
| prod-002 | Ashwagandha Gold Extract | ₹999 | Capsules |
| prod-003 | Shilajit Resin Ultra | ₹2,499 | Resin |
| prod-004 | Kesar Vigor Oil | ₹799 | Oil |
| prod-005 | Endurance Elixir Tonic | ₹1,799 | Tonic |

## Prioritized Backlog
### P0 (Critical) — Done
- All core features implemented and tested

### P1 (Next Phase)
- Admin panel for product CRUD
- Real product images (replace placeholders)
- Payment gateway integration (Razorpay/Stripe)
- Order management system
- Customer accounts/wishlists

### P2 (Future)
- Blog/content section for SEO
- Product reviews submission form
- Email newsletter signup
- Google Analytics / Meta Pixel integration
- Progressive Web App (PWA) support
- Multi-language support (Hindi)
