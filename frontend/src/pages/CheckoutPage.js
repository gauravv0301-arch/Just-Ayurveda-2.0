import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Trash2, Plus, Minus, Loader2, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { trackEvent } from '@/components/GoogleAnalytics';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID;

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

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

const inputCls = (hasError) =>
  `w-full h-11 px-4 rounded-xl border ${hasError ? 'border-red-400 ring-1 ring-red-400/30' : 'border-[#cfecd6]'} bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30 transition-colors`;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, clearCart, getTotal } = useCart();
  const defaultForm = { name: '', email: '', phone: '', house: '', street: '', landmark: '', city: '', state: '', pincode: '' };
  const [form, setForm] = useState(() => {
    try {
      const s = localStorage.getItem('ja_checkout_addr');
      if (s) { const parsed = JSON.parse(s); return { ...defaultForm, ...parsed }; }
    } catch {}
    return defaultForm;
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const total = getTotal();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Pin code: only digits, max 6
    if (name === 'pincode' && (!/^\d*$/.test(value) || value.length > 6)) return;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleStateChange = (val) => {
    setForm(prev => ({ ...prev, state: val }));
    if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
  };

  // Auto-detect city/state from pincode
  useEffect(() => {
    if (form.pincode?.length === 6) {
      setPinLoading(true);
      fetch(`https://api.postalpincode.in/pincode/${form.pincode}`)
        .then(r => r.json())
        .then(data => {
          if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
            const po = data[0].PostOffice[0];
            const detectedState = INDIAN_STATES.find(s => s.toLowerCase() === po.State?.toLowerCase()) || po.State;
            setForm(prev => ({
              ...prev,
              city: prev.city || po.District || po.Division || '',
              state: detectedState || prev.state,
            }));
            setErrors(prev => ({ ...prev, city: '', state: '' }));
            toast.success(`Detected: ${po.District}, ${po.State}`);
          }
        })
        .catch(() => {})
        .finally(() => setPinLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pincode]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.house.trim()) e.house = 'House number is required';
    if (!form.street.trim()) e.street = 'Street / area is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state) e.state = 'State is required';
    if (!form.pincode.trim()) e.pincode = 'Pin code is required';
    else if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Must be 6 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildAddress = () =>
    [form.house, form.street, form.landmark, form.city, form.state, form.pincode].filter(Boolean).join(', ');

  const handlePayment = async () => {
    if (!validate()) { toast.error('Please fill all required fields'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    // Save address for future
    localStorage.setItem('ja_checkout_addr', JSON.stringify(form));

    setProcessing(true);
    trackEvent('begin_checkout', { value: total, items: items.length });

    try {
      const item = items[0];
      const { data } = await axios.post(`${API}/orders/create`, {
        product_id: item.product.id, quantity: item.quantity,
        customer_name: form.name, customer_email: form.email,
        customer_phone: form.phone, customer_address: buildAddress(),
      });

      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error('Failed to load payment gateway'); setProcessing(false); return; }

      const options = {
        key: RAZORPAY_KEY, amount: data.amount, currency: data.currency,
        name: 'Just Ayurveda', description: `Order: ${data.product_name}`,
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
          } catch { navigate(`/failed?order_id=${data.order_id}`); }
        },
        modal: { ondismiss: () => { setProcessing(false); toast.info('Payment cancelled'); } },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#3bb44b' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { navigate(`/failed?order_id=${data.order_id}`); });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create order. Please try again.');
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
          <div className="lg:col-span-3 space-y-5">
            {/* Personal Details */}
            <div className="bg-white rounded-2xl p-6 border border-[#cfecd6]">
              <h2 className="font-['Outfit'] font-semibold text-[#233232] text-lg mb-5">Personal Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Full Name *</label>
                  <input data-testid="checkout-name" name="name" value={form.name} onChange={handleChange}
                    className={inputCls(errors.name)} placeholder="Enter your full name" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Email *</label>
                  <input data-testid="checkout-email" name="email" type="email" value={form.email} onChange={handleChange}
                    className={inputCls(errors.email)} placeholder="your@email.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Phone *</label>
                  <input data-testid="checkout-phone" name="phone" value={form.phone} onChange={handleChange}
                    className={inputCls(errors.phone)} placeholder="+91 XXXXX XXXXX" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl p-6 border border-[#cfecd6]">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-5 h-5 text-[#3bb44b]" />
                <h2 className="font-['Outfit'] font-semibold text-[#233232] text-lg">Delivery Address</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#233232] mb-1 block">House / Flat No. *</label>
                  <input data-testid="checkout-house" name="house" value={form.house} onChange={handleChange}
                    className={inputCls(errors.house)} placeholder="Flat 302, A-Block" />
                  {errors.house && <p className="text-red-500 text-xs mt-1">{errors.house}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Street / Area *</label>
                  <input data-testid="checkout-street" name="street" value={form.street} onChange={handleChange}
                    className={inputCls(errors.street)} placeholder="Sector 16C, Greater Noida" />
                  {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Landmark <span className="text-[#8dac96] font-normal">(Optional)</span></label>
                  <input data-testid="checkout-landmark" name="landmark" value={form.landmark} onChange={handleChange}
                    className={inputCls(false)} placeholder="Near Metro Station" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Pin Code *</label>
                  <div className="relative">
                    <input data-testid="checkout-pincode" name="pincode" value={form.pincode} onChange={handleChange} inputMode="numeric"
                      className={inputCls(errors.pincode)} placeholder="201310" maxLength={6} />
                    {pinLoading && <Loader2 className="w-4 h-4 animate-spin text-[#3bb44b] absolute right-3 top-3.5" />}
                  </div>
                  {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-[#233232] mb-1 block">City *</label>
                  <input data-testid="checkout-city" name="city" value={form.city} onChange={handleChange}
                    className={inputCls(errors.city)} placeholder="Greater Noida" />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-[#233232] mb-1 block">State *</label>
                  <Select value={form.state} onValueChange={handleStateChange}>
                    <SelectTrigger data-testid="checkout-state" className={`w-full rounded-xl h-11 ${errors.state ? 'border-red-400 ring-1 ring-red-400/30' : 'border-[#cfecd6]'} bg-white text-[#233232] text-sm`}>
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#cfecd6] max-h-60">
                      {INDIAN_STATES.map(s => (
                        <SelectItem key={s} value={s} className="text-[#233232] text-sm">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
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
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded-full border border-[#cfecd6] flex items-center justify-center text-[#4f5958] hover:bg-[#cfecd6]/30"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-medium text-[#233232] w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded-full border border-[#cfecd6] flex items-center justify-center text-[#4f5958] hover:bg-[#cfecd6]/30"><Plus className="w-3 h-3" /></button>
                        <button onClick={() => removeFromCart(item.product.id)} className="ml-auto text-[#8dac96] hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
