import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, MapPin, Package, Heart, LogOut, Pencil, Trash2, Plus, Star as StarIcon, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCustomer } from '@/context/CustomerContext';
import ProductCard from '@/components/ProductCard';
import ProductQuickView from '@/components/ProductQuickView';
import { resolveImageUrl } from '@/lib/images';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi (NCT)','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];
const inputCls = "w-full h-11 px-4 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30";
const emptyAddr = { label: 'Home', house: '', street: '', landmark: '', city: '', state: '', pincode: '', is_default: false };

export default function AccountPage() {
  const navigate = useNavigate();
  const { customer, isLoggedIn, loading: authLoading, logout, updateProfile, authHeaders, refreshProfile } = useCustomer();
  const [tab, setTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [addrDialog, setAddrDialog] = useState(false);
  const [editAddr, setEditAddr] = useState(null);
  const [addrForm, setAddrForm] = useState(emptyAddr);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigate('/auth?redirect=/account');
  }, [authLoading, isLoggedIn, navigate]);

  const fetchOrders = useCallback(async () => {
    try { const { data } = await axios.get(`${API}/customer/orders`, { headers: authHeaders() }); setOrders(data); }
    catch (e) { console.error('Fetch orders failed:', e); }
  }, [authHeaders]);

  const fetchWishlist = useCallback(async () => {
    if (!customer?.wishlist?.length) { setWishlistProducts([]); return; }
    try {
      const { data: allProducts } = await axios.get(`${API}/products`);
      setWishlistProducts(allProducts.filter(p => customer.wishlist.includes(p.id)));
    } catch (e) { console.error('Fetch wishlist failed:', e); }
  }, [customer?.wishlist]);

  useEffect(() => { if (isLoggedIn) { fetchOrders(); fetchWishlist(); } }, [isLoggedIn, fetchOrders, fetchWishlist]);
  useEffect(() => { if (customer) { setEditName(customer.name || ''); setEditEmail(customer.email || ''); } }, [customer]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try { await updateProfile({ name: editName, email: editEmail }); toast.success('Profile updated'); }
    catch (e) { console.error('Profile update failed:', e); toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleSaveAddr = async () => {
    setSaving(true);
    try {
      const headers = authHeaders();
      if (editAddr) {
        await axios.put(`${API}/customer/addresses/${editAddr.id}`, addrForm, { headers });
      } else {
        await axios.post(`${API}/customer/addresses`, addrForm, { headers });
      }
      await refreshProfile();
      setAddrDialog(false);
      toast.success(editAddr ? 'Address updated' : 'Address added');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setSaving(false); }
  };

  const deleteAddr = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try { await axios.delete(`${API}/customer/addresses/${id}`, { headers: authHeaders() }); await refreshProfile(); toast.success('Address deleted'); }
    catch (e) { console.error('Delete address failed:', e); toast.error('Failed'); }
  };

  const setDefault = async (id) => {
    try { await axios.put(`${API}/customer/addresses/${id}/default`, {}, { headers: authHeaders() }); await refreshProfile(); toast.success('Default address set'); }
    catch (e) { console.error('Set default failed:', e); toast.error('Could not set default address'); }
  };

  const removeWishlist = async (pid) => {
    try { await axios.delete(`${API}/customer/wishlist/${pid}`, { headers: authHeaders() }); await refreshProfile(); toast.success('Removed from wishlist'); }
    catch (e) { console.error('Remove wishlist failed:', e); toast.error('Could not remove from wishlist'); }
  };

  const openAddAddr = () => { setEditAddr(null); setAddrForm(emptyAddr); setAddrDialog(true); };
  const openEditAddr = (a) => { setEditAddr(a); setAddrForm({ ...a }); setAddrDialog(true); };
  const handleLogout = () => { logout(); navigate('/'); toast.success('Logged out'); };

  if (authLoading || !customer) return <div className="pt-24 pb-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#3bb44b]" /></div>;

  const addresses = customer.addresses || [];
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin, count: addresses.length },
    { id: 'orders', label: 'Orders', icon: Package, count: orders.length },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, count: customer.wishlist?.length || 0 },
  ];

  return (
    <div className="pt-20 md:pt-24 pb-16 bg-[#edfbf0] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-[#233232] font-['Outfit']">My Account</h1>
            <p className="text-sm text-[#4f5958] mt-1">Welcome back{customer.name ? `, ${customer.name}` : ''}</p>
          </div>
          <button data-testid="account-logout-btn" onClick={handleLogout} className="flex items-center gap-2 text-sm text-[#4f5958] hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`account-tab-${t.id}`}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-[#3bb44b] text-white' : 'bg-white text-[#4f5958] border border-[#cfecd6] hover:bg-[#cfecd6]/30'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
              {t.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-[#cfecd6]'}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 border border-[#cfecd6] max-w-lg">
            <h2 className="font-['Outfit'] font-semibold text-[#233232] text-lg mb-5">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#233232] mb-1 block">Full Name</label>
                <input data-testid="profile-name" value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#233232] mb-1 block">Phone</label>
                <input value={customer.phone || ''} readOnly className={`${inputCls} bg-[#cfecd6]/20 cursor-not-allowed`} />
              </div>
              <div>
                <label className="text-sm font-medium text-[#233232] mb-1 block">Email</label>
                <input data-testid="profile-email" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputCls} placeholder="your@email.com" />
              </div>
              <button data-testid="save-profile-btn" onClick={handleSaveProfile} disabled={saving}
                className="bg-cta-gradient text-white rounded-full px-6 py-2.5 text-sm font-semibold btn-hover-scale disabled:opacity-60 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {tab === 'addresses' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-['Outfit'] font-semibold text-[#233232] text-lg">Saved Addresses</h2>
              <button data-testid="add-address-btn" onClick={openAddAddr} className="flex items-center gap-1.5 bg-[#3bb44b] text-white rounded-full px-4 py-2 text-sm font-medium btn-hover-scale">
                <Plus className="w-4 h-4" /> Add Address
              </button>
            </div>
            {addresses.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-[#cfecd6] text-center">
                <MapPin className="w-10 h-10 text-[#cfecd6] mx-auto mb-3" />
                <p className="text-[#4f5958]">No saved addresses yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map(a => (
                  <div key={a.id} className={`bg-white rounded-2xl p-5 border ${a.is_default ? 'border-[#3bb44b] ring-1 ring-[#3bb44b]/20' : 'border-[#cfecd6]'}`} data-testid={`address-card-${a.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`text-xs ${a.is_default ? 'bg-[#3bb44b]/10 text-[#3bb44b] border-[#3bb44b]/20' : 'bg-[#cfecd6]/40 text-[#4f5958] border-[#cfecd6]'}`}>{a.label}{a.is_default && ' (Default)'}</Badge>
                      <div className="flex gap-1">
                        {!a.is_default && <button onClick={() => setDefault(a.id)} className="p-1.5 text-[#8dac96] hover:text-[#3bb44b]"><StarIcon className="w-4 h-4" /></button>}
                        <button onClick={() => openEditAddr(a)} className="p-1.5 text-[#8dac96] hover:text-[#3bb44b]"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteAddr(a.id)} className="p-1.5 text-[#8dac96] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <p className="text-sm text-[#233232] font-medium">{a.house}, {a.street}</p>
                    {a.landmark && <p className="text-sm text-[#4f5958]">{a.landmark}</p>}
                    <p className="text-sm text-[#4f5958]">{a.city}, {a.state} — {a.pincode}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div>
            <h2 className="font-['Outfit'] font-semibold text-[#233232] text-lg mb-5">Order History</h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-[#cfecd6] text-center">
                <Package className="w-10 h-10 text-[#cfecd6] mx-auto mb-3" />
                <p className="text-[#4f5958]">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(o => (
                  <div key={o.id} className="bg-white rounded-2xl p-5 border border-[#cfecd6] flex items-center gap-4" data-testid={`order-${o.id}`}>
                    {o.product_image && <div className="w-12 h-16 rounded-xl bg-[#cfecd6]/30 flex items-center justify-center p-1 shrink-0"><img src={resolveImageUrl(o.product_image)} alt="" className="w-full h-full object-contain" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#233232] text-sm">{o.product_name}</p>
                      <p className="text-xs text-[#4f5958]">Order: {o.id} &bull; Qty: {o.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#233232] font-['Outfit']">{"\u20B9"}{o.amount?.toLocaleString('en-IN')}</p>
                      <Badge className={`text-xs mt-1 ${o.status === 'paid' ? 'bg-[#3bb44b]/10 text-[#3bb44b]' : o.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {tab === 'wishlist' && (
          <div>
            <h2 className="font-['Outfit'] font-semibold text-[#233232] text-lg mb-5">My Wishlist</h2>
            {wishlistProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-[#cfecd6] text-center">
                <Heart className="w-10 h-10 text-[#cfecd6] mx-auto mb-3" />
                <p className="text-[#4f5958]">Your wishlist is empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistProducts.map((p, i) => (
                  <div key={p.id} className="relative">
                    <ProductCard product={p} index={i} onQuickView={setQuickViewProduct} />
                    <button onClick={() => removeWishlist(p.id)} className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-md text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Address Dialog */}
      <Dialog open={addrDialog} onOpenChange={setAddrDialog}>
        <DialogContent className="max-w-lg bg-white border-[#cfecd6] rounded-3xl">
          <DialogHeader><DialogTitle className="font-['Outfit'] text-[#233232]">{editAddr ? 'Edit Address' : 'Add Address'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-[#233232] mb-1 block">Label</label>
              <div className="flex gap-2">
                {['Home', 'Office', 'Other'].map(l => (
                  <button key={l} onClick={() => setAddrForm(p => ({ ...p, label: l }))}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${addrForm.label === l ? 'bg-[#3bb44b] text-white' : 'bg-[#cfecd6]/30 text-[#4f5958] border border-[#cfecd6]'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div><label className="text-sm font-medium text-[#233232] mb-1 block">House *</label><input value={addrForm.house} onChange={e => setAddrForm(p => ({ ...p, house: e.target.value }))} className={inputCls} placeholder="Flat 302" /></div>
            <div><label className="text-sm font-medium text-[#233232] mb-1 block">Street *</label><input value={addrForm.street} onChange={e => setAddrForm(p => ({ ...p, street: e.target.value }))} className={inputCls} placeholder="Sector 16C" /></div>
            <div className="col-span-2"><label className="text-sm font-medium text-[#233232] mb-1 block">Landmark</label><input value={addrForm.landmark} onChange={e => setAddrForm(p => ({ ...p, landmark: e.target.value }))} className={inputCls} placeholder="Near Metro" /></div>
            <div><label className="text-sm font-medium text-[#233232] mb-1 block">Pincode *</label><input value={addrForm.pincode} onChange={e => { if (/^\d{0,6}$/.test(e.target.value)) setAddrForm(p => ({ ...p, pincode: e.target.value })); }} className={inputCls} maxLength={6} inputMode="numeric" /></div>
            <div><label className="text-sm font-medium text-[#233232] mb-1 block">City *</label><input value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))} className={inputCls} /></div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-[#233232] mb-1 block">State *</label>
              <Select value={addrForm.state} onValueChange={v => setAddrForm(p => ({ ...p, state: v }))}>
                <SelectTrigger className="w-full rounded-xl h-11 border-[#cfecd6] bg-white text-sm"><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent className="bg-white border-[#cfecd6] max-h-60">{STATES.map(s => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <label className="col-span-2 flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={addrForm.is_default} onChange={e => setAddrForm(p => ({ ...p, is_default: e.target.checked }))} className="accent-[#3bb44b] w-4 h-4" />
              <span className="text-sm text-[#233232]">Set as default address</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setAddrDialog(false)} className="px-5 py-2 rounded-full border border-[#cfecd6] text-[#4f5958] text-sm">Cancel</button>
            <button data-testid="save-address-btn" onClick={handleSaveAddr} disabled={saving}
              className="px-5 py-2 rounded-full bg-[#3bb44b] text-white text-sm font-medium btn-hover-scale disabled:opacity-60 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ProductQuickView product={quickViewProduct} open={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
