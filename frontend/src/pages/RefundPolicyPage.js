import LegalPage from '@/components/LegalPage';

const content = `
## 1. Order Cancellation

You may cancel your order **before it is shipped** by contacting us as soon as possible. To cancel:

- Email **support@justayurveda.life** with your Order ID, **or**
- Reach out via [WhatsApp](https://wa.me/918874888221)

Once an order has been packed and handed over to the courier, it can no longer be cancelled. In that case, you may refuse delivery at your doorstep — and once we receive the returned package, we will initiate a refund as per our refund policy below.

## 2. Refund Eligibility

We offer refunds in the following situations:

- **Order cancelled before shipping** — full refund
- **Wrong product delivered** — full refund or free replacement
- **Damaged or tampered package** — full refund or free replacement (kindly share an unboxing video or photos within 48 hours of delivery)
- **Manufacturing defect** — full refund or free replacement (within 7 days of delivery)
- **Order never delivered after courier-confirmed lost in transit** — full refund

## 3. Non-Returnable / Non-Refundable Cases

Because our products are consumable Ayurvedic supplements, we **cannot accept returns** in the following cases for hygiene and safety reasons:

- Products with a broken seal or tampered packaging
- Products that have been opened or partially consumed
- Refund requests raised more than 7 days after delivery
- "Change of mind" returns after the product has been shipped
- Mismatch in personal preference, taste, or texture

## 4. Refund Timelines

Once your refund is approved, the amount is processed back to your **original payment method** through Razorpay:

| Payment Method | Typical Refund Time |
|---|---|
| UPI / Net Banking | 3–5 working days |
| Credit Card / Debit Card | 5–7 working days |
| Wallets (Paytm, PhonePe, etc.) | 24–48 hours |
| Cash on Delivery (if offered) | Refunded to bank account or UPI ID provided by you, within 7 working days |

Refund timelines depend on your bank or payment provider; we initiate the refund instantly upon approval.

## 5. How to Request a Refund

1. Email **support@justayurveda.life** within the eligible window (7 days for damaged/defective; 48 hours for unboxing complaints)
2. Include:
   - Your Order ID
   - Reason for refund
   - Photos / unboxing video (for damaged or wrong items)
3. Our team will respond within 2 business days with an acceptance, replacement offer, or further questions

## 6. Failed or Cancelled Payments

If your payment was deducted but the order was not placed (rare technical issues), the amount is automatically refunded by Razorpay to your account within 5–7 working days. If you don't see it after that, contact us with your transaction reference.

## 7. Refunds for Discount-Coupon Orders

If you cancel or return an order placed with a discount coupon, you will receive a refund of the **actual amount paid** (after discount). The coupon itself is not re-issued unless it was a one-time first-purchase coupon and the refund was due to our fault.

## 8. Contact

For any cancellation or refund concern, write to **support@justayurveda.life** or visit our [Contact page](/contact). We aim to resolve every case within 48 hours.
`;

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Cancellation and Refund Policy"
      subtitle="Our commitment to fair, transparent refunds — no fine print, no surprises."
      lastUpdated="May 22, 2026"
      metaDescription="Just Ayurveda Cancellation and Refund Policy — when refunds are issued, how to request one, and typical refund timelines via Razorpay."
      content={content}
    />
  );
}
