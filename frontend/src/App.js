import { useState, useEffect, useCallback } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { CartProvider } from '@/context/CartContext';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePageTracking, initGA } from '@/components/GoogleAnalytics';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AgeGate from '@/components/AgeGate';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import FAQPage from '@/pages/FAQPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderSuccessPage from '@/pages/OrderSuccessPage';
import OrderFailedPage from '@/pages/OrderFailedPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AgeGateWrapper({ ageVerified, onConfirm }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  if (isAdmin) return null;
  return <AgeGate open={!ageVerified} onConfirm={onConfirm} />;
}

function AppContent({ ageVerified, onAgeConfirm }) {
  usePageTracking();
  const scrollRef = useScrollReveal();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div ref={scrollRef} className="min-h-screen flex flex-col">
      <ScrollToTop />
      <AgeGateWrapper ageVerified={ageVerified} onConfirm={onAgeConfirm} />
      {!isAdmin && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success" element={<OrderSuccessPage />} />
          <Route path="/failed" element={<OrderFailedPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppFloat />}
    </div>
  );
}

function App() {
  const [ageVerified, setAgeVerified] = useState(false);

  useEffect(() => {
    const verified = sessionStorage.getItem('ja_age_verified');
    if (verified === 'true') setAgeVerified(true);
    initGA();
  }, []);

  const handleAgeConfirm = () => {
    setAgeVerified(true);
    sessionStorage.setItem('ja_age_verified', 'true');
  };

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#edfbf0]">
          <Toaster position="bottom-right" theme="light" toastOptions={{ style: { background: '#ffffff', color: '#233232', border: '1px solid #cfecd6' } }} />
          <AppContent ageVerified={ageVerified} onAgeConfirm={handleAgeConfirm} />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
