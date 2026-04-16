import { useState } from 'react';
import axios from 'axios';
import { MessageCircle, Mail, MapPin, Clock, Send, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[\d\s\+\-]{7,15}$/.test(form.phone.trim())) errs.phone = 'Enter a valid phone number';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (!form.message.trim()) errs.message = 'Message is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/contact`, form);
      setSubmitted(true);
      toast.success('Message sent successfully!');
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-20 md:pt-24 pb-16 bg-[#edfbf0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-3">Get in Touch</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-[#233232] font-['Outfit']">We're Here to Help</h1>
          <p className="mt-4 text-base text-[#4f5958] max-w-lg mx-auto">Have questions about our products or need personalized wellness advice? Reach out anytime.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-white rounded-3xl p-10 border border-[#cfecd6] text-center">
                <div className="w-16 h-16 bg-[#3bb44b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[#3bb44b]" />
                </div>
                <h3 className="text-xl font-['Outfit'] font-semibold text-[#233232] mb-2">Message Sent!</h3>
                <p className="text-[#4f5958] text-sm mb-6">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                <button data-testid="send-another-btn" onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', email: '', message: '' }); }}
                  className="text-[#3bb44b] text-sm font-medium hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-[#cfecd6]">
                <h3 className="font-['Outfit'] font-semibold text-[#233232] text-xl mb-6">Send Us a Message</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#233232] mb-1 block">Full Name *</label>
                    <input data-testid="contact-name" name="name" value={form.name} onChange={handleChange}
                      className={`w-full h-11 px-4 rounded-xl border ${errors.name ? 'border-red-400' : 'border-[#cfecd6]'} bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30`}
                      placeholder="Your full name" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#233232] mb-1 block">Phone Number *</label>
                      <input data-testid="contact-phone" name="phone" value={form.phone} onChange={handleChange}
                        className={`w-full h-11 px-4 rounded-xl border ${errors.phone ? 'border-red-400' : 'border-[#cfecd6]'} bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30`}
                        placeholder="+91 XXXXX XXXXX" />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#233232] mb-1 block">Email *</label>
                      <input data-testid="contact-email" name="email" type="email" value={form.email} onChange={handleChange}
                        className={`w-full h-11 px-4 rounded-xl border ${errors.email ? 'border-red-400' : 'border-[#cfecd6]'} bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30`}
                        placeholder="your@email.com" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#233232] mb-1 block">Message *</label>
                    <textarea data-testid="contact-message" name="message" value={form.message} onChange={handleChange} rows={4}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.message ? 'border-red-400' : 'border-[#cfecd6]'} bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30 resize-none`}
                      placeholder="How can we help you?" />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>
                  <button data-testid="contact-submit-btn" type="submit" disabled={submitting}
                    className="w-full bg-cta-gradient text-white rounded-full py-3.5 font-semibold flex items-center justify-center gap-2 btn-hover-scale disabled:opacity-60">
                    {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column - WhatsApp + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* WhatsApp Card */}
            <div className="bg-cta-gradient rounded-3xl p-7 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-['Outfit'] font-semibold text-lg mb-2">Quick Chat</h3>
                <p className="text-white/80 text-sm mb-5 leading-relaxed">Get instant responses on WhatsApp.</p>
                <a href="https://wa.me/918874888221" target="_blank" rel="noopener noreferrer" data-testid="contact-whatsapp-btn"
                  className="inline-flex items-center gap-2 bg-white text-[#3bb44b] rounded-full px-5 py-2.5 font-semibold text-sm btn-hover-scale">
                  <MessageCircle className="w-4 h-4" /> Start Chat
                </a>
              </div>
            </div>

            {/* Store Details */}
            <div className="bg-white rounded-3xl p-7 border border-[#cfecd6]">
              <h3 className="font-['Outfit'] font-semibold text-[#233232] text-lg mb-5">Store Details</h3>
              <div className="space-y-4">
                {[
                  { icon: MessageCircle, label: 'WhatsApp', value: '+91 88748 88221' },
                  { icon: Mail, label: 'Email', value: 'support@justayurveda.in' },
                  { icon: Clock, label: 'Hours', value: 'Mon - Sat, 10 AM - 7 PM' },
                  { icon: MapPin, label: 'Location', value: 'India - Ships Nationwide' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-[#cfecd6]/60 rounded-xl flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-[#3bb44b]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#233232]">{item.label}</p>
                      <p className="text-sm text-[#4f5958]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
