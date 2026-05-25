import LegalPage from '@/components/LegalPage';

const content = `
## 1. Introduction

These Terms and Conditions ("Terms") govern your access to and use of the Just Ayurveda website (justayurveda.life) and the products and services offered by Just Ayurveda ("we", "us", "our"). By accessing the site or placing an order, you agree to be bound by these Terms.

## 2. Eligibility

You must be at least 18 years old and capable of forming a legally binding contract under Indian law to use this website or purchase our products.

## 3. Products and Disclaimers

- Just Ayurveda products are traditional Ayurvedic wellness formulations intended as dietary supplements. They are **not** intended to diagnose, treat, cure, or prevent any disease.
- Results vary by individual. We do not guarantee specific outcomes, and our claims are not evaluated by the Food and Drug Administration of any country.
- Please consult a qualified medical professional before starting any new supplement, especially if you have a medical condition, are taking prescription medication, or are pregnant or nursing.

## 4. Account and Information Accuracy

You agree to provide accurate, current, and complete information when registering or placing an order. You are responsible for safeguarding your account credentials and for all activity that occurs under your account.

## 5. Orders, Pricing and Payment

- All prices are displayed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.
- We reserve the right to refuse or cancel any order at our sole discretion, including for pricing errors, suspected fraud, or stock unavailability.
- Payments are processed through **Razorpay**, our authorised payment gateway partner. We do not store your card or banking details.

## 6. Intellectual Property

All content on this website — including text, graphics, logos, product images, and branding — is the property of Just Ayurveda and is protected under applicable Indian and international copyright and trademark laws. You may not copy, reproduce, modify, or redistribute any content without our prior written consent.

## 7. User Conduct

You agree not to:

- Use the website for any unlawful or fraudulent purpose
- Attempt to gain unauthorised access to any portion of the website or its underlying systems
- Submit false, misleading, or harmful content through reviews, contact forms, or any other channel
- Reverse-engineer, scrape, or interfere with the website's normal operation

## 8. Limitation of Liability

To the maximum extent permitted by law, Just Ayurveda shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the website or products. Our total liability for any claim shall not exceed the amount paid by you for the specific order giving rise to the claim.

## 9. Indemnification

You agree to indemnify and hold Just Ayurveda, its directors, employees, and partners harmless from any claims, damages, or expenses arising from your breach of these Terms or your misuse of the website.

## 10. Modifications

We may update these Terms at any time. Changes take effect immediately upon posting to this page. Your continued use of the website after changes are posted constitutes acceptance of the updated Terms.

## 11. Governing Law and Jurisdiction

These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts at our registered business location.

## 12. Contact

For any queries regarding these Terms, please reach out via our [Contact page](/contact) or email **support@justayurveda.life**.
`;

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      subtitle="The rules and agreements that govern your use of Just Ayurveda."
      lastUpdated="May 22, 2026"
      metaDescription="Read the Terms and Conditions of Just Ayurveda — including product disclaimers, payment terms, limitation of liability, and governing law."
      content={content}
    />
  );
}
