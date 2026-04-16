import { MessageCircle, Mail, MapPin, Clock } from 'lucide-react';

export default function ContactSection() {
  return (
    <section id="contact" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 scroll-reveal">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-3">
            Get in Touch
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#233232] font-['Outfit']">
            We're Here to Help
          </h2>
          <p className="mt-4 text-base text-[#4f5958] max-w-lg mx-auto">
            Have questions about our products or need personalized wellness advice? Reach out anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* WhatsApp Card */}
          <div className="scroll-reveal scroll-reveal-delay-1 bg-cta-gradient rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-['Outfit'] font-semibold text-xl mb-2">Chat on WhatsApp</h3>
              <p className="text-white/80 text-sm mb-6 leading-relaxed">
                Get instant responses to your queries. Our wellness advisors are available to help you choose the right products.
              </p>
              <a
                href="https://wa.me/918874888221"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="contact-whatsapp-btn"
                className="inline-flex items-center gap-2 bg-white text-[#3bb44b] rounded-full px-6 py-3 font-semibold text-sm btn-hover-scale"
              >
                <MessageCircle className="w-4 h-4" />
                Start Chat
              </a>
            </div>
          </div>

          {/* Info Card */}
          <div className="scroll-reveal scroll-reveal-delay-2 bg-[#cfecd6]/30 rounded-3xl p-8 border border-[#cfecd6]/50">
            <h3 className="font-['Outfit'] font-semibold text-[#233232] text-xl mb-6">Store Details</h3>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#cfecd6]/60 rounded-xl flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-[#3bb44b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#233232]">WhatsApp</p>
                  <p className="text-sm text-[#4f5958]">+91 88748 88221</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#cfecd6]/60 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#3bb44b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#233232]">Email</p>
                  <p className="text-sm text-[#4f5958]">support@justayurveda.in</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#cfecd6]/60 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#3bb44b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#233232]">Support Hours</p>
                  <p className="text-sm text-[#4f5958]">Mon - Sat, 10:00 AM - 7:00 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#cfecd6]/60 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#3bb44b]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#233232]">Location</p>
                  <p className="text-sm text-[#4f5958]">India — Ships Nationwide</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
