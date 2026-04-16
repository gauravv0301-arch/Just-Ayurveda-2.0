import { Package, HeadphonesIcon, ShieldCheck } from 'lucide-react';

const badges = [
  {
    icon: Package,
    title: 'Discreet Packaging',
    description: 'Plain packaging with no product details visible on the outside.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Fast Support',
    description: 'Quick responses via WhatsApp for all your queries and orders.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Ordering',
    description: 'Safe checkout with trusted payment methods and data protection.',
  },
];

export default function TrustBadges() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {badges.map((badge, i) => (
            <div
              key={badge.title}
              data-testid={`trust-badge-${i}`}
              className={`scroll-reveal scroll-reveal-delay-${i + 1} flex items-start gap-4 p-6 rounded-2xl bg-[#cfecd6]/30 border border-[#cfecd6]/50`}
            >
              <div className="trust-icon-bg w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                <badge.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-['Outfit'] font-semibold text-[#233232] text-base">
                  {badge.title}
                </h3>
                <p className="text-sm text-[#4f5958] mt-1 leading-relaxed">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
