import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What makes Just Ayurveda products different?',
    answer: 'Our products are crafted using time-tested Ayurvedic formulations with premium-grade, clinically studied ingredients. Every batch is manufactured in GMP-certified facilities and third-party tested for purity and potency.',
  },
  {
    question: 'How long does shipping take?',
    answer: 'We typically ship within 24 hours of order confirmation. Standard delivery takes 3-5 business days across India. All orders are shipped in plain, discreet packaging with no product details visible on the outside.',
  },
  {
    question: 'Is my order really discreet?',
    answer: 'Absolutely. We use plain packaging with no branding or product descriptions visible. Your privacy is our top priority. The sender name on the package will be generic.',
  },
  {
    question: 'Are these products safe to use?',
    answer: 'Our products are made from natural Ayurvedic ingredients and are generally well-tolerated. However, we always recommend consulting your healthcare provider before starting any new supplement, especially if you have pre-existing medical conditions or are on medication.',
  },
  {
    question: 'How do I place an order?',
    answer: 'You can place an order directly through our website by clicking the "Buy Now" button on any product. This will connect you with our team on WhatsApp, where we\'ll guide you through the ordering process and payment options.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a hassle-free return policy. If you\'re not satisfied with your purchase, contact us within 7 days of delivery through WhatsApp and we\'ll arrange a return or replacement.',
  },
  {
    question: 'Can I get a consultation before buying?',
    answer: 'Yes! We offer free consultations via WhatsApp. Our wellness advisors can help you choose the right products based on your needs and answer any questions you may have.',
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-16 md:py-24 bg-[#edfbf0]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 scroll-reveal">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-3">
            Got Questions?
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#233232] font-['Outfit']">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="scroll-reveal">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-[#cfecd6] rounded-2xl px-5 bg-white data-[state=open]:bg-[#cfecd6]/10 data-[state=open]:shadow-sm transition-all"
              >
                <AccordionTrigger
                  data-testid={`faq-trigger-${i}`}
                  className="text-sm md:text-base text-[#233232] font-medium hover:no-underline py-4 text-left"
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#4f5958] leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
