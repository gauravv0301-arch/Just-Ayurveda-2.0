import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';

const Hero3DScene = lazy(() => import('@/components/Hero3DScene'));

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative min-h-[90vh] flex items-center overflow-hidden bg-hero-gradient">
      {/* Animated gradient blob (CSS fallback behind 3D) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
        <div className="hero-blob w-[500px] h-[500px] md:w-[700px] md:h-[700px] opacity-40" />
      </div>

      {/* 3D Scene (desktop only, lazy loaded) */}
      <Suspense fallback={null}>
        <Hero3DScene />
      </Suspense>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-2xl">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-4">Premium Ayurvedic Wellness</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#233232] font-['Outfit'] leading-tight">
            Revive Your<span className="gradient-text block">Natural Vitality</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base md:text-lg text-[#4f5958] leading-relaxed max-w-lg">
            Discover time-tested Ayurvedic formulations crafted for modern men's wellness. Premium ingredients, discreet delivery, and trusted support.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-10 flex flex-wrap gap-4">
            <button data-testid="hero-shop-now-btn" onClick={() => navigate('/products')}
              className="bg-cta-gradient text-white rounded-full px-8 py-3.5 font-semibold text-base flex items-center gap-2 btn-hover-scale shadow-lg shadow-[#3bb44b]/20">
              Shop Now <ArrowRight className="w-4 h-4" />
            </button>
            <a href="https://wa.me/918874888221" target="_blank" rel="noopener noreferrer" data-testid="hero-whatsapp-btn"
              className="bg-white/80 border border-[#cfecd6] text-[#233232] rounded-full px-8 py-3.5 font-semibold text-base flex items-center gap-2 btn-hover-scale hover:bg-white">
              <MessageCircle className="w-4 h-4 text-[#3bb44b]" /> Chat on WhatsApp
            </a>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 text-xs text-[#8dac96]">All orders shipped in plain, discreet packaging.</motion.p>
        </div>
      </div>
    </section>
  );
}
