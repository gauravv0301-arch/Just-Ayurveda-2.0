import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { trackEvent } from '@/components/GoogleAnalytics';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart, getTotal } = useCart();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [processing, setProcessing] = useState(false);
  const total = getTotal();

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePayment = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    setProcessing(true);
    trackEvent('begin_checkout', { value: total, items: items.length });

    try {
      // Create order for first item (simple single-product checkout)
      const item = items[0];
      const { data } = await axios.post(`${API}/orders/create`, {
        product_id: item.product.id, quantity: item.quantity,
        customer_name: form.name, customer_email: form.email,
        customer_phone: form.phone, customer_address: form.address,
      });

      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error('Failed to load payment gateway'); setProcessing(false); return; }

      const options = {
        key: RAZORPAY_KEY,
        amount: data.amount,
        currency: data.currency,
        name: 'Just Ayurveda',
        description: `Order: ${data.product_name}`,
        order_id: data.razorpay_order_id,
        handler: async (response) => {
          try {
            await axios.post(`${API}/orders/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: data.order_id,
            });
            trackEvent('purchase', { order_id: data.order_id, value: total });
            clearCart();
            navigate(`/success?order_id=${data.order_id}`);
          } catch {
            navigate(`/failed?order_id=${data.order_id}`);
          }
        },
        modal: { ondismiss: () => { setProcessing(false); toast.info('Payment cancelled'); } },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#3bb44b' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { navigate(`/failed?order_id=${data.order_id}`); });
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create order. Please try again.';
      toast.error(msg);
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-16 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <ShoppingBag className="w-16 h-16 text-[#cfecd6] mb-4" />
        <h2 className="text-2xl font-['Outfit'] font-semibold text-[#233232] mb-2">Your cart is empty</h2>
        <p className="text-[#4f5958] mb-6">Browse our products and add something to get started.</p>
        <button onClick={() => navigate('/products')} className="bg-cta-gradient text-white rounded-full px-8 py-3 font-semibold btn-hover-scale">Browse Products</button>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24 pb-16 bg-[#edfbf0] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-[#233232] font-['Outfit'] mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#cfecd6]">
              <h2 className="font-['Outfit'] font-semibold text-[#233232] text-lg mb-5">Your Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Full Name *</label>
                  <input data-testid="checkout-name" name="name" value={form.name} onChange={handleChange}
                    className="w-full h-11 px-4 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" placeholder="Enter your full name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Email *</label>
                  <input data-testid="checkout-email" name="email" type="email" value={form.email} onChange={handleChange}
                    className="w-full h-11 px-4 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Phone *</label>
                  <input data-testid="checkout-phone" name="phone" value={form.phone} onChange={handleChange}
                    className="w-full h-11 px-4 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Delivery Address</label>
                  <textarea data-testid="checkout-address" name="address" value={form.address} onChange={handleChange} rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30 resize-none" placeholder="Full delivery address" />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-[#cfecd6] sticky top-24">
              <h2 className="font-['Outfit'] font-semibold text-[#233232] text-lg mb-5">Order Summary</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3" data-testid={`cart-item-${item.product.id}`}>
                    <img src={item.product.image} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover bg-[#cfecd6]/30" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#233232] truncate">{item.product.name}</p>
                      <p className="text-sm text-[#4f5958]">{"\u20B9"}{item.product.price.toLocaleString('en-IN')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded-full border border-[#cfecd6] flex items-center justify-center text-[#4f5958] hover:bg-[#cfecd6]/30">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium text-[#233232] w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded-full border border-[#cfecd6] flex items-center justify-center text-[#4f5958] hover:bg-[#cfecd6]/30">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeFromCart(item.product.id)} className="ml-auto text-[#8dac96] hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#cfecd6] mt-5 pt-4">
                <div className="flex justify-between text-sm text-[#4f5958]"><span>Subtotal</span><span>{"\u20B9"}{total.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-sm text-[#4f5958] mt-1"><span>Shipping</span><span className="text-[#3bb44b]">Free</span></div>
                <div className="flex justify-between font-bold text-[#233232] text-lg mt-3 font-['Outfit']"><span>Total</span><span>{"\u20B9"}{total.toLocaleString('en-IN')}</span></div>
              </div>

              <button data-testid="pay-now-btn" onClick={handlePayment} disabled={processing}
                className="w-full mt-6 bg-cta-gradient text-white rounded-full py-3.5 font-semibold flex items-center justify-center gap-2 btn-hover-scale disabled:opacity-60 disabled:cursor-not-allowed">
                {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><ShoppingBag className="w-5 h-5" /> Pay {"\u20B9"}{total.toLocaleString('en-IN')}</>}
              </button>

              <p className="text-xs text-[#8dac96] text-center mt-3">Secured by Razorpay. Discreet billing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
