import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { question: 'What makes Just Ayurveda products different?', answer: 'Our products are crafted using time-tested Ayurvedic formulations with premium-grade, clinically studied ingredients. Every batch is manufactured in GMP-certified facilities and third-party tested.' },
  { question: 'How long does shipping take?', answer: 'We ship within 24 hours of order confirmation. Standard delivery takes 3-5 business days across India. All orders use plain, discreet packaging.' },
  { question: 'Is my order really discreet?', answer: 'Absolutely. Plain packaging with no branding or product descriptions. The sender name will be generic. Your privacy is our top priority.' },
  { question: 'Are these products safe to use?', answer: 'Our products are made from natural Ayurvedic ingredients and are generally well-tolerated. We recommend consulting your healthcare provider before starting any new supplement.' },
  { question: 'How do I place an order?', answer: 'Click "Buy Now" on any product to proceed to checkout with secure payment. You can also order via WhatsApp for personalized assistance.' },
  { question: 'What payment methods do you accept?', answer: 'We accept UPI, credit/debit cards, net banking, and popular wallets through our secure Razorpay payment gateway.' },
  { question: 'What is your return policy?', answer: 'Contact us within 7 days of delivery through WhatsApp for hassle-free returns or replacements.' },
  { question: 'Can I get a consultation before buying?', answer: 'Yes! Free consultations via WhatsApp. Our wellness advisors help you choose products based on your specific needs.' },
];

export default function FAQPage() {
  return (
    <div className="pt-20 md:pt-24 pb-16 bg-[#edfbf0]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-3">Got Questions?</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-[#233232] font-['Outfit']">Frequently Asked Questions</h1>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-[#cfecd6] rounded-2xl px-5 bg-white data-[state=open]:bg-[#cfecd6]/10 data-[state=open]:shadow-sm transition-all">
              <AccordionTrigger data-testid={`faq-trigger-${i}`} className="text-sm md:text-base text-[#233232] font-medium hover:no-underline py-4 text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-sm text-[#4f5958] leading-relaxed pb-4">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
