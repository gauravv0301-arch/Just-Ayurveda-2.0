import { Zap, Heart, Shield, Clock, Leaf, Award } from 'lucide-react';

const benefits = [
  {
    icon: Leaf,
    title: '100% Natural',
    description: 'Pure Ayurvedic ingredients with no synthetic additives or fillers.',
  },
  {
    icon: Shield,
    title: 'GMP Certified',
    description: 'Manufactured in certified facilities following strict quality standards.',
  },
  {
    icon: Zap,
    title: 'Clinically Studied',
    description: 'Key ingredients backed by clinical research and traditional wisdom.',
  },
  {
    icon: Heart,
    title: 'Holistic Wellness',
    description: 'Formulated to support overall vitality, not just isolated symptoms.',
  },
  {
    icon: Clock,
    title: 'Consistent Results',
    description: 'Designed for sustained benefits with regular, daily use over time.',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'Every batch is third-party tested for purity, potency, and safety.',
  },
];

export default function BenefitsSection() {
  return (
    <section id="benefits" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 scroll-reveal">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-3">
            Why Choose Us
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#233232] font-['Outfit']">
            The Just Ayurveda Promise
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, i) => (
            <div
              key={benefit.title}
              data-testid={`benefit-card-${i}`}
              className={`scroll-reveal scroll-reveal-delay-${(i % 4) + 1} group p-6 rounded-2xl bg-[#cfecd6]/30 border border-[#cfecd6]/50 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#cfecd6]/60 group-hover:bg-cta-gradient flex items-center justify-center mb-4 transition-all duration-300">
                <benefit.icon className="w-5 h-5 text-[#3bb44b] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-['Outfit'] font-semibold text-[#233232] text-base mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-[#4f5958] leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
