import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, ShoppingBag, User, Globe } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { useTranslation } from 'react-i18next';

const LOGO_URL = "/logo.png";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getCount } = useCart();
  const { isLoggedIn, customer } = useCustomer();
  const { t, i18n } = useTranslation();
  const cartCount = getCount();

  const NAV_LINKS = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.products'), to: '/products' },
    { label: t('nav.blog'), to: '/blog' },
    { label: t('nav.about'), to: '/about' },
    { label: t('nav.certifications'), to: '/certifications' },
    { label: t('nav.faq'), to: '/faq' },
    { label: t('nav.contact'), to: '/contact' },
  ];

  const toggleLang = () => {
    const next = i18n.language?.startsWith('hi') ? 'en' : 'hi';
    i18n.changeLanguage(next);
  };
  const langLabel = i18n.language?.startsWith('hi') ? 'EN' : 'हिं';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav data-testid="navbar" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'nav-glass shadow-sm' : 'bg-[#edfbf0]/60 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5 shrink-0">
            <img src={LOGO_URL} alt="Just Ayurveda" className="h-10 md:h-12 w-auto object-contain" />
            <span className="hidden lg:block text-[10px] text-[#8dac96] font-medium tracking-wide leading-tight border-l border-[#cfecd6] pl-2.5">Revive Your<br/>Natural Vitality</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} data-testid={`nav-link-${link.to.replace('/','') || 'home'}`}
                className={`text-sm font-medium transition-colors tracking-wide ${location.pathname === link.to ? 'text-[#3bb44b]' : 'text-[#4f5958] hover:text-[#3bb44b]'}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input data-testid="search-input" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..." className="w-40 md:w-56 h-9 px-3 text-sm rounded-full border border-[#cfecd6] bg-white/80 text-[#233232] placeholder-[#8dac96] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" autoFocus />
                <button type="button" data-testid="search-close-btn" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="ml-2 text-[#4f5958] hover:text-[#3bb44b]">
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button data-testid="search-open-btn" onClick={() => setSearchOpen(true)} className="p-2 text-[#4f5958] hover:text-[#3bb44b] transition-colors">
                <Search className="w-5 h-5" />
              </button>
            )}

            <button data-testid="lang-toggle-btn" onClick={toggleLang} title="Switch language"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#cfecd6] text-xs font-semibold text-[#4f5958] hover:bg-[#cfecd6]/40 transition-colors">
              <Globe className="w-3.5 h-3.5 text-[#3bb44b]" /> {langLabel}
            </button>

            <Link to="/checkout" data-testid="cart-btn" className="relative p-2 text-[#4f5958] hover:text-[#3bb44b] transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[#3bb44b] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">{cartCount}</span>
              )}
            </Link>

            {isLoggedIn ? (
              <Link to="/account" data-testid="account-btn" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#cfecd6]/40 text-[#233232] hover:bg-[#cfecd6] transition-colors text-sm font-medium">
                <User className="w-4 h-4 text-[#3bb44b]" />
                <span className="max-w-[80px] truncate">{customer?.name || t('nav.account')}</span>
              </Link>
            ) : (
              <Link to="/auth" data-testid="login-btn" className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full bg-cta-gradient text-white text-sm font-medium btn-hover-scale">
                <User className="w-4 h-4" /> {t('nav.login')}
              </Link>
            )}

            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button data-testid="mobile-menu-btn" className="p-2 text-[#4f5958]"><Menu className="w-5 h-5" /></button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#edfbf0] border-l-[#cfecd6] w-72">
                  <SheetTitle className="font-['Outfit'] text-[#233232] text-lg mb-6">Menu</SheetTitle>
                  <div className="flex flex-col gap-4 mt-4">
                    {NAV_LINKS.map((link) => (
                      <Link key={link.to} to={link.to} data-testid={`mobile-nav-${link.to.replace('/','') || 'home'}`}
                        className="text-base font-medium text-[#233232] hover:text-[#3bb44b] transition-colors py-2 px-3 rounded-xl hover:bg-[#cfecd6]/40"
                        onClick={() => setMobileOpen(false)}>
                        {link.label}
                      </Link>
                    ))}
                    <button data-testid="mobile-lang-toggle" onClick={() => { toggleLang(); }}
                      className="flex items-center justify-center gap-2 border border-[#cfecd6] text-[#233232] rounded-full py-2.5 px-6 font-medium text-sm">
                      <Globe className="w-4 h-4 text-[#3bb44b]" /> {i18n.language?.startsWith('hi') ? 'English' : 'हिंदी'}
                    </button>
                    <a href="https://wa.me/918874888221" target="_blank" rel="noopener noreferrer" data-testid="mobile-whatsapp-btn"
                      className="mt-2 flex items-center justify-center gap-2 bg-[#3bb44b] text-white rounded-full py-3 px-6 font-medium text-sm btn-hover-scale">
                      Chat on WhatsApp
                    </a>
                    {isLoggedIn ? (
                      <Link to="/account" className="flex items-center justify-center gap-2 border border-[#cfecd6] text-[#233232] rounded-full py-3 px-6 font-medium text-sm" onClick={() => setMobileOpen(false)}>
                        <User className="w-4 h-4" /> My Account
                      </Link>
                    ) : (
                      <Link to="/auth" className="flex items-center justify-center gap-2 border border-[#cfecd6] text-[#233232] rounded-full py-3 px-6 font-medium text-sm" onClick={() => setMobileOpen(false)}>
                        <User className="w-4 h-4" /> Login / Sign Up
                      </Link>
                    )}
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
