import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Trash2, Plus, Minus, Loader2, MapPin, User, Check, Tag, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { trackEvent } from '@/components/GoogleAnalytics';
import { getPrimaryImage } from '@/lib/images';

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
  const { isLoggedIn, customer, authHeaders } = useCustomer();
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
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [pinLoading, setPinLoading] = useState(false);
  const total = getTotal();
  const savedAddresses = customer?.addresses || [];

  // Pre-fill from customer profile
  useEffect(() => {
    if (isLoggedIn && customer) {
      setForm(prev => ({
        ...prev,
        name: prev.name || customer.name || '',
        email: prev.email || customer.email || '',
        phone: prev.phone || customer.phone || '',
      }));
      const defaultAddr = savedAddresses.find(a => a.is_default);
      if (defaultAddr && !selectedAddrId) {
        setSelectedAddrId(defaultAddr.id);
        setForm(prev => ({ ...prev, house: defaultAddr.house, street: defaultAddr.street, landmark: defaultAddr.landmark || '', city: defaultAddr.city, state: defaultAddr.state, pincode: defaultAddr.pincode }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, customer]);

  const selectAddress = (addr) => {
    setSelectedAddrId(addr.id);
    setForm(prev => ({ ...prev, house: addr.house, street: addr.street, landmark: addr.landmark || '', city: addr.city, state: addr.state, pincode: addr.pincode }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await axios.post(`${API}/coupons/validate`, { code: couponCode, order_total: total });
      setCouponApplied(data.coupon);
      setDiscount(data.discount);
      toast.success(`Coupon "${data.coupon.code}" applied! You save \u20B9${data.discount}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid coupon');
      setCouponApplied(null);
      setDiscount(0);
    } finally { setCouponLoading(false); }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setDiscount(0);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const finalTotal = total - discount;

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

  const [paymentError, setPaymentError] = useState(null);

  const handlePayment = async () => {
    setPaymentError(null);
    if (!validate()) { toast.error('Please fill all required fields'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    if (!RAZORPAY_KEY) { setPaymentError({ title: 'Payment gateway not configured', detail: 'Razorpay key missing. Please contact support.' }); return; }

    // Save address for future
    localStorage.setItem('ja_checkout_addr', JSON.stringify(form));

    setProcessing(true);
    trackEvent('begin_checkout', { value: total, items: items.length });

    let data;
    try {
      const item = items[0];
      const headers = isLoggedIn ? authHeaders() : {};
      const resp = await axios.post(`${API}/orders/create`, {
        product_id: item.product.id, quantity: item.quantity,
        customer_name: form.name, customer_email: form.email,
        customer_phone: form.phone, customer_address: buildAddress(),
        coupon_code: couponApplied?.code || '', discount_amount: discount,
      }, { headers });
      data = resp.data;
      if (!data?.razorpay_order_id) throw new Error('Server returned an invalid payment session.');
    } catch (err) {
      console.error('Order creation failed:', err);
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.message || 'Unknown error';
      setPaymentError({
        title: status === 401 ? 'Razorpay authentication failed'
              : status === 502 ? 'Could not connect to payment gateway'
              : status === 400 ? 'Invalid order details'
              : 'Server unable to create order',
        detail,
      });
      setProcessing(false);
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setPaymentError({ title: 'Razorpay script failed to load', detail: 'Please check your internet connection and try again.' });
      setProcessing(false);
      return;
    }

    try {
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
          } catch (vErr) {
            console.error('Payment verification failed:', vErr);
            navigate(`/failed?order_id=${data.order_id}&reason=verification_failed`);
          }
        },
        modal: { ondismiss: () => { setProcessing(false); toast.info('Payment cancelled. You can retry anytime.'); } },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#3bb44b' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        console.error('Razorpay payment.failed:', resp?.error);
        const reason = resp?.error?.description || 'Payment was unsuccessful';
        setPaymentError({ title: 'Payment failed', detail: reason });
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay modal open failed:', err);
      setPaymentError({ title: 'Unable to initialize payment', detail: err.message || 'Razorpay checkout failed to open.' });
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
            {/* Login Prompt / Saved Address Selection */}
            {!isLoggedIn ? (
              <div className="bg-[#cfecd6]/20 rounded-2xl p-4 border border-[#cfecd6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#3bb44b]" />
                  <p className="text-sm text-[#233232]">Have an account? <Link to="/auth?redirect=/checkout" className="text-[#3bb44b] font-semibold hover:underline">Login</Link> for saved addresses</p>
                </div>
              </div>
            ) : savedAddresses.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-[#cfecd6]">
                <h2 className="font-['Outfit'] font-semibold text-[#233232] text-base mb-3">Saved Addresses</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map(a => (
                    <button key={a.id} onClick={() => selectAddress(a)} data-testid={`select-addr-${a.id}`}
                      className={`text-left p-3 rounded-xl border transition-colors ${selectedAddrId === a.id ? 'border-[#3bb44b] bg-[#3bb44b]/5 ring-1 ring-[#3bb44b]/20' : 'border-[#cfecd6] hover:bg-[#cfecd6]/20'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <Badge className="text-xs bg-[#cfecd6]/40 text-[#4f5958] border-[#cfecd6]">{a.label}</Badge>
                        {selectedAddrId === a.id && <Check className="w-4 h-4 text-[#3bb44b]" />}
                      </div>
                      <p className="text-sm text-[#233232] font-medium">{a.house}, {a.street}</p>
                      <p className="text-xs text-[#4f5958]">{a.city}, {a.state} — {a.pincode}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    <div className="w-14 h-20 rounded-xl bg-[#cfecd6]/30 flex items-center justify-center p-1.5 shrink-0"><img src={getPrimaryImage(item.product)} alt={item.product.name} className="w-full h-full object-contain" /></div>
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
                {/* Coupon Section */}
                <div className="mb-4">
                  {couponApplied ? (
                    <div className="flex items-center justify-between bg-[#3bb44b]/5 border border-[#3bb44b]/20 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#3bb44b]" />
                        <span className="text-sm font-semibold text-[#3bb44b]">{couponApplied.code}</span>
                        <span className="text-xs text-[#4f5958]">({couponApplied.discount_value}% off)</span>
                      </div>
                      <button onClick={removeCoupon} data-testid="remove-coupon-btn" className="p-1 text-[#8dac96] hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input data-testid="coupon-input" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code" className="flex-1 h-10 px-3 rounded-xl border border-[#cfecd6] text-sm text-[#233232] placeholder-[#8dac96] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30"
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()} />
                      <button data-testid="apply-coupon-btn" onClick={applyCoupon} disabled={couponLoading}
                        className="px-4 h-10 bg-[#cfecd6]/50 hover:bg-[#cfecd6] text-[#233232] rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-1">
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-3.5 h-3.5" />} Apply
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-sm text-[#4f5958]"><span>Subtotal</span><span>{"\u20B9"}{total.toLocaleString('en-IN')}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm text-[#3bb44b] mt-1"><span>Discount</span><span>-{"\u20B9"}{discount.toLocaleString('en-IN')}</span></div>}
                <div className="flex justify-between text-sm text-[#4f5958] mt-1"><span>Shipping</span><span className="text-[#3bb44b]">Free</span></div>
                <div className="flex justify-between font-bold text-[#233232] text-lg mt-3 font-['Outfit']"><span>Total</span><span>{"\u20B9"}{finalTotal.toLocaleString('en-IN')}</span></div>
              </div>

              {paymentError && (
                <div data-testid="payment-error-banner" className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                      <X className="w-4 h-4" /> {paymentError.title}
                    </p>
                    <p className="text-xs text-red-600 mt-1">{paymentError.detail}</p>
                  </div>
                  <div className="flex gap-2">
                    <button data-testid="retry-payment-btn" onClick={handlePayment}
                      className="flex-1 bg-[#3bb44b] text-white rounded-full py-2 text-sm font-medium hover:bg-[#2e9038]">
                      Retry Payment
                    </button>
                    <button onClick={() => window.location.reload()}
                      className="px-4 bg-white border border-[#cfecd6] text-[#4f5958] rounded-full py-2 text-sm font-medium hover:bg-[#cfecd6]/40">
                      Reload
                    </button>
                  </div>
                </div>
              )}

              <button data-testid="pay-now-btn" onClick={handlePayment} disabled={processing}
                className="w-full mt-6 bg-cta-gradient text-white rounded-full py-3.5 font-semibold flex items-center justify-center gap-2 btn-hover-scale disabled:opacity-60 disabled:cursor-not-allowed">
                {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><ShoppingBag className="w-5 h-5" /> Pay {"\u20B9"}{finalTotal.toLocaleString('en-IN')}</>}
              </button>
              <p className="text-xs text-[#8dac96] text-center mt-3">Secured by Razorpay. Discreet billing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
