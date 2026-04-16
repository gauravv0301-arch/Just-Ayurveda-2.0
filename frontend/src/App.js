import { useState, useEffect, useCallback } from 'react';
import '@/App.css';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { useScrollReveal } from '@/hooks/useScrollReveal';

import Navbar from '@/components/Navbar';
import AgeGate from '@/components/AgeGate';
import HeroSection from '@/components/HeroSection';
import TrustBadges from '@/components/TrustBadges';
import ProductGrid from '@/components/ProductGrid';
import ProductDetailModal from '@/components/ProductDetailModal';
import BenefitsSection from '@/components/BenefitsSection';
import FAQSection from '@/components/FAQSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useScrollReveal();

  // Check if age was already verified
  useEffect(() => {
    const verified = sessionStorage.getItem('ja_age_verified');
    if (verified === 'true') setAgeVerified(true);
  }, []);

  const fetchProducts = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      toast.error('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAgeConfirm = () => {
    setAgeVerified(true);
    sessionStorage.setItem('ja_age_verified', 'true');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchProducts(query);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  return (
    <div className="min-h-screen bg-[#edfbf0]">
      <Toaster
        position="bottom-right"
        theme="light"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#233232',
            border: '1px solid #cfecd6',
          },
        }}
      />

      {/* Age Gate */}
      <AgeGate open={!ageVerified} onConfirm={handleAgeConfirm} />

      {/* Main Content */}
      <div ref={scrollRef}>
        <Navbar onSearch={handleSearch} />

        <main>
          <HeroSection />
          <TrustBadges />
          <ProductGrid
            products={products}
            loading={loading}
            onViewDetails={handleViewDetails}
            searchQuery={searchQuery}
          />
          <BenefitsSection />
          <FAQSection />
          <ContactSection />
        </main>

        <Footer />
        <WhatsAppFloat />
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default App;
