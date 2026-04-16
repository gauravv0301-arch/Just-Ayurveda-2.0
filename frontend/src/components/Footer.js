import { MessageCircle } from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_9174a9c7-fdaa-4d6e-8012-e706aac63019/artifacts/xpbtujgt_WhatsApp%20Image%202026-04-15%20at%206.35.09%20PM.jpeg";

const footerLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Products', href: '#products' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

export default function Footer() {
  const handleClick = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-dark-gradient text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <img src={LOGO_URL} alt="Just Ayurveda" className="h-12 w-auto mb-4 brightness-200" />
            <p className="text-[#8dac96] text-sm leading-relaxed max-w-xs">
              Premium Ayurvedic wellness products crafted for the modern man. 
              Trusted ingredients, discreet delivery, and dedicated support.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-['Outfit'] font-semibold text-white text-base mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2.5">
              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  data-testid={`footer-link-${link.label.toLowerCase()}`}
                  className="text-sm text-[#8dac96] hover:text-[#3bb44b] transition-colors"
                  onClick={(e) => { e.preventDefault(); handleClick(link.href); }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <h4 className="font-['Outfit'] font-semibold text-white text-base mb-4">Connect With Us</h4>
            <p className="text-sm text-[#8dac96] mb-4 leading-relaxed">
              Need help choosing the right product? Our wellness advisors are just a message away.
            </p>
            <a
              href="https://wa.me/918874888221"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-whatsapp-btn"
              className="inline-flex items-center gap-2 bg-[#3bb44b] hover:bg-[#61a06c] text-white rounded-full px-6 py-2.5 font-medium text-sm transition-colors btn-hover-scale"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Disclaimer + Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-xs text-[#8dac96]/70 leading-relaxed max-w-3xl">
            <strong className="text-[#8dac96]">Disclaimer:</strong> The products and information on this website are intended for general wellness purposes only and are not meant to diagnose, treat, cure, or prevent any disease. Results may vary. Please consult your healthcare professional before using any supplements, especially if you have pre-existing medical conditions. This website is intended for adults (18+) only.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-3">
            <p className="text-xs text-[#8dac96]/50">
              {new Date().getFullYear()} Just Ayurveda. All rights reserved.
            </p>
            <p className="text-xs text-[#8dac96]/50">
              All orders shipped in plain, discreet packaging.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
