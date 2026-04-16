import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import TrustBadges from '@/components/TrustBadges';
import BenefitsSection from '@/components/BenefitsSection';
import ProductCard from '@/components/ProductCard';
import ProductQuickView from '@/components/ProductQuickView';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    axios.get(`${API}/products?sort=popularity`).then(res => { setProducts(res.data.slice(0, 3)); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <HeroSection />
      <TrustBadges />

      <section className="py-16 md:py-24 bg-[#edfbf0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 scroll-reveal">
            <p className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-3">Best Sellers</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#233232] font-['Outfit']">Featured Products</h2>
          </div>
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          )}
          <div className="text-center mt-12 scroll-reveal">
            <Link to="/products" data-testid="view-all-products-btn"
              className="inline-flex items-center gap-2 bg-cta-gradient text-white rounded-full px-8 py-3.5 font-semibold text-base btn-hover-scale shadow-lg shadow-[#3bb44b]/20">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <BenefitsSection />

      <section className="py-16 md:py-24 bg-dark-gradient text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center scroll-reveal">
          <h2 className="text-3xl md:text-4xl font-semibold font-['Outfit'] mb-4">Ready to Transform Your Wellness?</h2>
          <p className="text-[#8dac96] text-base md:text-lg mb-8 leading-relaxed">Join thousands of men who trust Just Ayurveda for their daily vitality needs.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/products" className="bg-[#3bb44b] hover:bg-[#61a06c] text-white rounded-full px-8 py-3.5 font-semibold btn-hover-scale">
              Browse Products
            </Link>
            <a href="https://wa.me/918874888221" target="_blank" rel="noopener noreferrer"
              className="border border-[#8dac96] text-white hover:bg-white/10 rounded-full px-8 py-3.5 font-semibold btn-hover-scale">
              Get Free Consultation
            </a>
          </div>
        </div>
      </section>

      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
