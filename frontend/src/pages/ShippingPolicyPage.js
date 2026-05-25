import LegalPage from '@/components/LegalPage';

const content = `
## 1. Delivery Zones

We currently ship across **all serviceable PIN codes in India** through trusted courier partners (such as Delhivery, BlueDart, India Post). If your PIN code is non-serviceable, our team will reach out within 24 hours to suggest an alternative or refund your payment.

## 2. Shipping Timelines

| Region | Estimated Delivery Time |
|---|---|
| Metro cities (Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad) | 2–4 business days |
| Tier-2 & Tier-3 cities | 4–7 business days |
| Remote / North-East / Hilly areas | 7–10 business days |

Orders placed before 2:00 PM IST on a working day are typically processed and dispatched the same day. Orders placed on weekends or public holidays are processed on the next working day.

## 3. Shipping Charges

- **Free shipping** on all prepaid orders.
- For Cash-on-Delivery orders (where applicable), a nominal handling fee may be added at checkout.

## 4. Order Tracking

Once your order is dispatched, you will receive an **SMS and email** with the courier name, AWB (tracking) number, and tracking link. You can also view live order status on the **My Account → Orders** page after logging in.

## 5. Discreet Packaging

We ship every order in **plain, discreet, unmarked packaging** that respects your privacy. No product name or branding is visible on the outer box — only the courier label.

## 6. Damaged or Tampered Package

If your package arrives damaged or with a broken seal:

1. **Do not accept the parcel** if the damage is visible at the time of delivery, or
2. If you've already accepted it, record an **unboxing video** showing the unopened package and immediately email **support@justayurveda.life** within **48 hours** with photos and video evidence.
3. Our team will arrange a free replacement or full refund per our [Refund Policy](/cancellation-and-refund).

## 7. Exchange Policy

For hygiene and safety reasons, Ayurvedic supplements with an opened or broken seal **cannot be exchanged**. However, we offer free replacement in the following cases:

- Wrong product delivered (different SKU than what you ordered)
- Manufacturing defect (e.g., cracked capsule, leaking bottle) reported within 7 days
- Damaged in transit (reported within 48 hours with unboxing video)

Send a quick note to **support@justayurveda.life** with your Order ID and we'll arrange a pickup + replacement at no extra cost.

## 8. Failed Delivery / Wrong Address

If a delivery fails due to incorrect address, unavailable recipient after multiple attempts, or refusal at the door (without a valid reason), the order will be returned to us. Re-shipping is subject to a re-attempt fee. Please double-check your address and phone number at checkout.

## 9. Address Changes

You can edit your delivery address **before the order is dispatched**. Email or WhatsApp our support team with your Order ID and the updated address. Once the courier has picked up your order, we cannot change the delivery address.

## 10. Contact

For any shipping or exchange query, please reach out via our [Contact page](/contact), email **support@justayurveda.life**, or message us on [WhatsApp](https://wa.me/918874888221).
`;

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      title="Shipping and Exchange Policy"
      subtitle="Fast, discreet, all-India delivery — and what we do when something goes wrong."
      lastUpdated="May 22, 2026"
      metaDescription="Just Ayurveda Shipping and Exchange Policy — delivery timelines, discreet packaging, tracking, damaged-order handling, and exchange conditions."
      content={content}
    />
  );
}
