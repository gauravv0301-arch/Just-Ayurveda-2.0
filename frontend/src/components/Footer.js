import { Link } from 'react-router-dom';
import { MessageCircle, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_9174a9c7-fdaa-4d6e-8012-e706aac63019/artifacts/xpbtujgt_WhatsApp%20Image%202026-04-15%20at%206.35.09%20PM.jpeg";

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Blog', to: '/blog' },
  { label: 'About Us', to: '/about' },
  { label: 'Certifications', to: '/certifications' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
];

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/justayurveda', label: 'Instagram' },
  { icon: Facebook, href: 'https://facebook.com/justayurveda', label: 'Facebook' },
  { icon: Twitter, href: 'https://x.com/justayurveda', label: 'X (Twitter)' },
  { icon: Youtube, href: 'https://youtube.com/@justayurveda', label: 'YouTube' },
  { icon: MessageCircle, href: 'https://wa.me/918874888221', label: 'WhatsApp' },
];

export default function Footer() {
  return (
    <footer className="bg-dark-gradient text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <img src={LOGO_URL} alt="Just Ayurveda" className="h-12 w-auto mb-4 brightness-200" />
            <p className="text-[#8dac96] text-sm leading-relaxed max-w-xs">
              Premium Ayurvedic wellness products crafted for the modern man.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-['Outfit'] font-semibold text-white text-base mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2.5">
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to} data-testid={`footer-link-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                  className="text-sm text-[#8dac96] hover:text-[#3bb44b] transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-['Outfit'] font-semibold text-white text-base mb-4">Connect With Us</h4>
            <p className="text-sm text-[#8dac96] mb-5 leading-relaxed">Follow us for wellness tips, offers, and updates.</p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`footer-social-${social.label.toLowerCase().replace(/[\s()]/g, '')}`}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-[#8dac96] hover:bg-[#3bb44b] hover:text-white hover:border-[#3bb44b] hover:scale-110 transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-['Outfit'] font-semibold text-white text-base mb-4">Need Help?</h4>
            <p className="text-sm text-[#8dac96] mb-4 leading-relaxed">WhatsApp is our primary support channel. Get instant help.</p>
            <a href="https://wa.me/918874888221" target="_blank" rel="noopener noreferrer" data-testid="footer-whatsapp-btn"
              className="inline-flex items-center gap-2 bg-[#3bb44b] hover:bg-[#61a06c] text-white rounded-full px-6 py-2.5 font-medium text-sm transition-colors btn-hover-scale">
              <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Disclaimer + Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-xs text-[#8dac96]/70 leading-relaxed max-w-3xl">
            <strong className="text-[#8dac96]">Disclaimer:</strong> Products and information on this website are for general wellness purposes only and are not meant to diagnose, treat, cure, or prevent any disease. Results may vary. Consult your healthcare professional before using any supplements. This website is for adults (18+) only.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-3">
            <p className="text-xs text-[#8dac96]/50">{new Date().getFullYear()} Just Ayurveda. All rights reserved.</p>
            <p className="text-xs text-[#8dac96]/50">All orders shipped in plain, discreet packaging.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
