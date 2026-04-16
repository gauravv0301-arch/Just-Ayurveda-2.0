import { Leaf, Shield, Heart, Eye, Award, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="pt-20 md:pt-24 bg-[#edfbf0]">
      {/* Hero */}
      <section className="bg-hero-gradient py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-3">Our Story</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#233232] font-['Outfit']">About Just Ayurveda</h1>
          <p className="mt-6 text-base md:text-lg text-[#4f5958] leading-relaxed max-w-2xl mx-auto">
            Founded on the principles of ancient Ayurvedic wisdom, Just Ayurveda is dedicated to empowering modern men with natural, effective wellness solutions they can trust.
          </p>
        </div>
      </section>

      {/* Brand Introduction */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-semibold text-[#233232] font-['Outfit'] mb-6">Who We Are</h2>
            <p className="text-[#4f5958] leading-relaxed mb-4">Just Ayurveda was born from a simple belief: that every man deserves access to premium-quality, natural wellness products without compromise or judgment. We bridge the gap between centuries-old Ayurvedic tradition and the demands of modern life.</p>
            <p className="text-[#4f5958] leading-relaxed">Our team of Ayurvedic practitioners, researchers, and wellness experts work together to create formulations that are both rooted in tradition and validated by modern science. Every product undergoes rigorous testing in GMP-certified facilities to ensure the highest standards of purity, potency, and safety.</p>
          </div>
          <div className="bg-hero-gradient rounded-3xl p-10 text-center">
            <div className="text-6xl font-bold gradient-text font-['Outfit']">5+</div>
            <p className="text-[#4f5958] mt-2">Premium Products</p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div><div className="text-2xl font-bold text-[#233232] font-['Outfit']">10K+</div><p className="text-sm text-[#4f5958]">Happy Customers</p></div>
              <div><div className="text-2xl font-bold text-[#233232] font-['Outfit']">4.8</div><p className="text-sm text-[#4f5958]">Avg Rating</p></div>
              <div><div className="text-2xl font-bold text-[#233232] font-['Outfit']">100%</div><p className="text-sm text-[#4f5958]">Natural</p></div>
              <div><div className="text-2xl font-bold text-[#233232] font-['Outfit']">GMP</div><p className="text-sm text-[#4f5958]">Certified</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-16 md:py-20 bg-[#edfbf0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-[#233232] font-['Outfit'] mb-6">Our Philosophy</h2>
          <p className="text-[#4f5958] leading-relaxed text-base md:text-lg max-w-3xl mx-auto">
            We believe in the power of balance — the foundation of Ayurvedic medicine. Our approach combines the wisdom of ancient Rasayana (rejuvenation) practices with clinically studied ingredients to deliver products that support your body's natural vitality. We don't make quick-fix promises. Instead, we provide sustainable, holistic wellness support that works with your body, not against it.
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-[#233232] font-['Outfit'] mb-10 text-center">Why Choose Just Ayurveda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Complete Discretion', desc: 'Plain packaging, private billing, and zero judgment. Your wellness journey stays personal.' },
              { icon: Leaf, title: 'Premium Ingredients', desc: 'We source only the finest herbs — KSM-66 Ashwagandha, pure Himalayan Shilajit, and more.' },
              { icon: Heart, title: 'Customer First', desc: 'Dedicated WhatsApp support, free wellness consultations, and hassle-free returns.' },
              { icon: Award, title: 'Quality Assured', desc: 'GMP-certified manufacturing, third-party lab testing, and strict quality control at every step.' },
              { icon: Eye, title: 'Transparent Formulas', desc: 'Full ingredient disclosure with dosages. No proprietary blends, no hidden fillers.' },
              { icon: Users, title: 'Expert Guidance', desc: 'Our Ayurvedic wellness advisors help you choose the right products for your specific needs.' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#cfecd6]/30 border border-[#cfecd6]/50">
                <div className="w-12 h-12 rounded-xl bg-cta-gradient flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-['Outfit'] font-semibold text-[#233232] text-base mb-2">{item.title}</h3>
                <p className="text-sm text-[#4f5958] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-20 bg-dark-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold font-['Outfit'] mb-6">Our Mission</h2>
          <p className="text-[#8dac96] text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            To make premium Ayurvedic wellness accessible, understandable, and stigma-free for every man. We envision a world where natural health solutions are the first choice — not the last resort. Through education, transparency, and unwavering quality, we're building a brand that men trust for life.
          </p>
        </div>
      </section>
    </div>
  );
}
