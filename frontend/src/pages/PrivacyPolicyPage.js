import LegalPage from '@/components/LegalPage';

const content = `
## 1. Introduction

Just Ayurveda ("we", "us", "our") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains what data we collect, how we use it, and the rights you have over it.

## 2. Information We Collect

We collect information that you voluntarily provide to us when you register, place an order, contact support, or interact with our site:

- **Account details:** name, mobile number, email address
- **Delivery details:** address, city, state, PIN code, landmark
- **Order data:** items purchased, payment amount, applied coupons, order status
- **Authentication data:** mobile number for one-time-password (OTP) login and password (securely hashed) for email login
- **Communications:** messages submitted via contact forms or support emails
- **Browsing data:** session cookies, cart contents, wishlist, language preference

## 3. How We Use Your Information

We use the data we collect to:

- Process and deliver your orders
- Send transactional notifications (order confirmation, delivery updates) via SMS, email, or WhatsApp
- Authenticate you through phone OTP or email login
- Provide customer support
- Improve our products, website, and user experience
- Detect and prevent fraud or abuse

## 4. OTP and Mobile Number

We use **Twilio** as our SMS provider to deliver one-time-passwords (OTPs) to your mobile number for authentication. The OTP is valid for 5 minutes and is used solely for verifying your identity. We do not use your mobile number for marketing without your explicit consent.

## 5. Payment Processing

All online payments are processed by **Razorpay**, our PCI-DSS-compliant payment gateway partner. Razorpay collects and stores your payment instrument details (card, UPI, netbanking, wallet) on its secure infrastructure. **We do not store, view, or have access to your full card number, CVV, or banking credentials.** Refer to [Razorpay's Privacy Policy](https://razorpay.com/privacy/) for details.

## 6. Cookies and Session Data

We use cookies and browser storage to:

- Keep you logged in across sessions
- Remember your cart and wishlist
- Remember your language and address preferences
- Measure site traffic and improve performance (via Google Analytics)

You can disable cookies in your browser, but parts of the site may not function correctly.

## 7. Data Sharing

We share your data only with the following trusted partners, and only to the extent necessary to deliver our service:

- **Razorpay** — payment processing
- **Twilio** — SMS OTP delivery
- **Shipping partners** (e.g., Delhivery, India Post) — order delivery
- **Cloud infrastructure providers** — hosting and storage
- **Government authorities** — only when required by valid legal process

We do **not** sell or rent your personal information to third parties.

## 8. Data Retention

We retain order and account data for as long as your account remains active and for a reasonable period thereafter to comply with tax and accounting regulations under Indian law (typically 7–8 years). OTP records are auto-purged within 24 hours.

## 9. Your Rights

You have the right to:

- Access the personal information we hold about you
- Correct inaccurate data through your Account page
- Request deletion of your account and associated data (subject to legal retention requirements)
- Withdraw consent for marketing communications

To exercise these rights, email **support@justayurveda.life**.

## 10. Security

We implement reasonable technical and organisational measures to protect your data, including HTTPS encryption, hashed passwords (bcrypt), signed JWT tokens, and isolated cloud storage. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.

## 11. Children's Privacy

Our products and services are not directed at individuals under 18 years of age. We do not knowingly collect data from minors.

## 12. Updates to this Policy

We may revise this Privacy Policy from time to time. Material changes will be highlighted on this page with an updated revision date.

## 13. Contact Us

For questions about this Privacy Policy or your data, please reach out via our [Contact page](/contact) or email **support@justayurveda.life**.
`;

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How Just Ayurveda collects, uses, and protects your personal information."
      lastUpdated="May 22, 2026"
      metaDescription="Just Ayurveda Privacy Policy — what data we collect, how OTP and payments are handled, cookies, your rights, and data protection commitments."
      content={content}
    />
  );
}
