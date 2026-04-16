import { useState, useEffect } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_9174a9c7-fdaa-4d6e-8012-e706aac63019/artifacts/xpbtujgt_WhatsApp%20Image%202026-04-15%20at%206.35.09%20PM.jpeg";

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Products', href: '#products' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar({ onSearch }) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
    const productsSection = document.getElementById('products');
    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavClick = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      data-testid="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-glass shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a
            href="#home"
            data-testid="nav-logo"
            className="flex items-center gap-2 shrink-0"
            onClick={(e) => { e.preventDefault(); handleNavClick('#home'); }}
          >
            <img src={LOGO_URL} alt="Just Ayurveda" className="h-10 md:h-12 w-auto object-contain" />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
                className="text-sm font-medium text-[#4f5958] hover:text-[#3bb44b] transition-colors tracking-wide"
                onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Search + Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  data-testid="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-40 md:w-56 h-9 px-3 text-sm rounded-full border border-[#cfecd6] bg-white/80 text-[#233232] placeholder-[#8dac96] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30"
                  autoFocus
                />
                <button
                  type="button"
                  data-testid="search-close-btn"
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); if (onSearch) onSearch(''); }}
                  className="ml-2 text-[#4f5958] hover:text-[#3bb44b]"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                data-testid="search-open-btn"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-[#4f5958] hover:text-[#3bb44b] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button data-testid="mobile-menu-btn" className="p-2 text-[#4f5958]">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#edfbf0] border-l-[#cfecd6] w-72">
                  <SheetTitle className="font-['Outfit'] text-[#233232] text-lg mb-6">Menu</SheetTitle>
                  <div className="flex flex-col gap-4 mt-4">
                    {NAV_LINKS.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        data-testid={`mobile-nav-${link.label.toLowerCase()}`}
                        className="text-base font-medium text-[#233232] hover:text-[#3bb44b] transition-colors py-2 px-3 rounded-xl hover:bg-[#cfecd6]/40"
                        onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
                      >
                        {link.label}
                      </a>
                    ))}
                    <a
                      href="https://wa.me/918874888221"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="mobile-whatsapp-btn"
                      className="mt-4 flex items-center justify-center gap-2 bg-[#3bb44b] text-white rounded-full py-3 px-6 font-medium text-sm btn-hover-scale"
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
