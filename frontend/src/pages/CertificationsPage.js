import { useState } from 'react';
import { ShieldCheck, FileText, Download, Eye, BadgeCheck, Building2, Calendar, MapPin, ChevronRight, X, Award, Lock, Leaf } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const documents = [
  {
    id: 'gst',
    title: 'GST Registration Certificate',
    authority: 'Government of India — Goods & Services Tax',
    icon: Building2,
    badgeColor: 'from-[#3bb44b] to-[#61a06c]',
    status: 'Active',
    details: [
      { label: 'GSTIN', value: '09FJLPS8832K1Z7' },
      { label: 'Legal Name', value: 'Just Ayurveda' },
      { label: 'State', value: 'Uttar Pradesh' },
      { label: 'City', value: 'Greater Noida' },
      { label: 'Registration Type', value: 'Regular' },
      { label: 'Status', value: 'Active' },
    ],
    description: 'Our GST registration ensures that all transactions are fully compliant with Indian tax regulations. Every purchase includes proper tax documentation for your records.',
  },
  {
    id: 'fssai',
    title: 'FSSAI License',
    authority: 'Food Safety and Standards Authority of India',
    icon: Leaf,
    badgeColor: 'from-[#233232] to-[#4f5958]',
    status: 'Valid',
    details: [
      { label: 'Registration No', value: '22722446000652' },
      { label: 'Issued By', value: 'Food Safety and Standards Authority of India' },
      { label: 'Valid Till', value: '03 August 2027' },
      { label: 'Category', value: 'Food Business Operator' },
      { label: 'Status', value: 'Valid & Active' },
    ],
    description: 'Our FSSAI registration certifies that all our products meet the safety and quality standards mandated by the Food Safety and Standards Authority of India. This ensures our formulations are safe for consumption.',
  },
];

const trustPoints = [
  { icon: BadgeCheck, title: '100% Genuine & Registered', desc: 'Fully registered business operating under all applicable Indian regulations and licensing requirements.' },
  { icon: ShieldCheck, title: 'Government Compliant', desc: 'Compliant with GST, FSSAI, and all relevant government regulations for health and wellness products.' },
  { icon: Lock, title: 'Safe & Reliable Products', desc: 'Every product is manufactured in GMP-certified facilities with strict quality control and third-party testing.' },
];

export default function CertificationsPage() {
  const [viewDoc, setViewDoc] = useState(null);

  const handleDownload = (doc) => {
    toast.info('PDF documents will be available for download soon.', { description: 'Please contact us on WhatsApp for immediate document requests.' });
  };

  return (
    <div className="pt-20 md:pt-24 pb-16 bg-[#edfbf0]">
      {/* Hero */}
      <section className="bg-hero-gradient py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-cta-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-[#3bb44b]/20">
              <Award className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-3">Transparency & Trust</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-[#233232] font-['Outfit']">
            Our Certifications & Legal Documents
          </h1>
          <p className="mt-5 text-base md:text-lg text-[#4f5958] leading-relaxed max-w-2xl mx-auto">
            We believe in complete transparency and trust. All our certifications and registrations are listed below for your verification.
          </p>
        </div>
      </section>

      {/* Verified Banner */}
      <div className="bg-white border-y border-[#cfecd6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 bg-[#3bb44b]/10 text-[#3bb44b] px-4 py-2 rounded-full">
            <BadgeCheck className="w-5 h-5" />
            <span className="text-sm font-semibold font-['Outfit']">Verified Business</span>
          </div>
          <span className="text-sm text-[#4f5958] hidden sm:inline">All documents are genuine and can be verified with respective authorities.</span>
        </div>
      </div>

      {/* Document Cards */}
      <section className="py-14 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {documents.map((doc) => (
              <div
                key={doc.id}
                data-testid={`doc-card-${doc.id}`}
                className="bg-white rounded-3xl border border-[#cfecd6] overflow-hidden product-card-hover shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${doc.badgeColor} p-6 relative overflow-hidden`}>
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                        <doc.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-['Outfit'] font-semibold text-white text-lg">{doc.title}</h3>
                      <p className="text-white/70 text-xs mt-1">{doc.authority}</p>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">{doc.status}</span>
                  </div>
                </div>

                {/* Key Details Preview */}
                <div className="p-6">
                  <div className="space-y-3">
                    {doc.details.slice(0, 3).map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-[#8dac96]">{d.label}</span>
                        <span className="text-sm font-semibold text-[#233232] font-mono">{d.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-[#4f5958] mt-4 leading-relaxed line-clamp-2">{doc.description}</p>

                  {/* Actions */}
                  <div className="flex gap-3 mt-5">
                    <button
                      data-testid={`view-doc-${doc.id}`}
                      onClick={() => setViewDoc(doc)}
                      className="flex-1 bg-[#cfecd6]/40 hover:bg-[#cfecd6]/70 text-[#233232] rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                    <button
                      data-testid={`download-doc-${doc.id}`}
                      onClick={() => handleDownload(doc)}
                      className="px-5 py-2.5 bg-cta-gradient text-white rounded-full text-sm font-medium flex items-center gap-2 btn-hover-scale"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-3">Why Trust Us</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#233232] font-['Outfit']">
              Your Safety Is Our Priority
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustPoints.map((tp, i) => (
              <div key={i} data-testid={`trust-point-${i}`} className="text-center p-6 rounded-2xl bg-[#cfecd6]/20 border border-[#cfecd6]/40">
                <div className="w-14 h-14 bg-cta-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#3bb44b]/15">
                  <tp.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-['Outfit'] font-semibold text-[#233232] text-base mb-2">{tp.title}</h3>
                <p className="text-sm text-[#4f5958] leading-relaxed">{tp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="bg-dark-gradient py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FileText className="w-8 h-8 text-[#8dac96] mx-auto mb-3" />
          <p className="text-sm text-[#8dac96] leading-relaxed">
            All certifications and registrations displayed on this page are genuine and verifiable with the respective government authorities. For any queries regarding our legal compliance, please contact us via WhatsApp or email at support@justayurveda.in.
          </p>
        </div>
      </section>

      {/* Document Detail Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        {viewDoc && (
          <DialogContent className="max-w-lg bg-white border-[#cfecd6] rounded-3xl p-0 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${viewDoc.badgeColor} p-6`}>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <viewDoc.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="font-['Outfit'] font-semibold text-white text-lg">{viewDoc.title}</DialogTitle>
                    <p className="text-white/70 text-xs mt-0.5">{viewDoc.authority}</p>
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Details */}
            <div className="p-6">
              <div className="bg-[#cfecd6]/15 rounded-2xl p-5 space-y-3 mb-5">
                {viewDoc.details.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#cfecd6]/30 last:border-0">
                    <span className="text-sm text-[#8dac96]">{d.label}</span>
                    <span className="text-sm font-semibold text-[#233232] font-mono text-right max-w-[55%]">{d.value}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-[#4f5958] leading-relaxed mb-5">{viewDoc.description}</p>

              <div className="flex items-center gap-2 bg-[#3bb44b]/8 rounded-xl p-3">
                <BadgeCheck className="w-5 h-5 text-[#3bb44b] shrink-0" />
                <span className="text-xs text-[#3bb44b] font-medium">This document is genuine and can be verified with the issuing authority.</span>
              </div>

              <button
                data-testid={`modal-download-${viewDoc.id}`}
                onClick={() => handleDownload(viewDoc)}
                className="w-full mt-5 bg-cta-gradient text-white rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 btn-hover-scale"
              >
                <Download className="w-4 h-4" /> Download Certificate
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
