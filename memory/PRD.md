# Just Ayurveda — PRD & Project Memory

## Original Problem Statement
Premium e-commerce website for "Just Ayurveda" — men's Ayurvedic wellness brand with WhatsApp + Razorpay ordering, admin panel, and multi-page structure.

## Architecture
- **Frontend**: React (CRA) + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend**: FastAPI + MongoDB (Motor) + Razorpay SDK
- **Database**: MongoDB (products, admin_users, orders, contact_messages)
- **Auth**: JWT Bearer tokens for admin panel
- **Payments**: Razorpay (test mode placeholder keys)
- **Analytics**: GA4 (placeholder ID)

## Features Implemented
- [x] Multi-page routing (11 pages)
- [x] Product Quick View Modal (click card → modal with 3 CTAs)
- [x] Individual product pages (/product/:slug) with tabs, FAQ, reviews, related
- [x] Add to Cart + Buy Now buttons across modal and detail pages
- [x] Cart system (localStorage, CartContext, badge count)
- [x] Checkout flow with Razorpay (placeholder keys)
- [x] Admin panel (product CRUD, order viewing, stats)
- [x] Contact form (name, phone, email, message) with validation
- [x] WhatsApp integration (floating button, pre-filled messages)
- [x] Google Analytics tracking (placeholder ID)
- [x] Age gate REMOVED (per user request)
- [x] About Us page with brand story
- [x] FAQ page, Contact page, Order success/failed pages

## Admin: admin@justayurveda.in / admin123

## Testing: 100% backend (24/24), 100% frontend

## Backlog
- P1: Add real Razorpay keys, GA4 ID, real product images
- P2: Customer accounts, blog, reviews form, coupon system, multi-language
