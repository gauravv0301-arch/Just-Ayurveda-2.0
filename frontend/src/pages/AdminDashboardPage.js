import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Pencil, Trash2, LogOut, Package, ShoppingCart, Loader2, Users, Tag, Search, Ban, CheckCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import MultiImageUploader from '@/components/MultiImageUploader';
import { getPrimaryImage, resolveImageUrl } from '@/lib/images';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
function getHeaders() { return { Authorization: `Bearer ${sessionStorage.getItem('ja_admin_token')}` }; }
const emptyProduct = { name: '', slug: '', short_description: '', description: '', highlights: [], ingredients: '', usage_guide: '', price: 0, original_price: 0, image: '', images: [], category: '', popularity: 50, faqs: [], reviews: [] };
const emptyCoupon = { code: '', discount_type: 'percentage', discount_value: 10, min_order: 0, max_discount: 0, expiry: '', usage_limit: 0, active: true };

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [tab, setTab] = useState('products');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('product'); // product | coupon | user
  const [editProduct, setEditProduct] = useState(null);
  const [editCoupon, setEditCoupon] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [saving, setSaving] = useState(false);
  const [highlightsStr, setHighlightsStr] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [prods, ords, usrs, cpns] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/admin/orders`, { headers: getHeaders() }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/users`, { headers: getHeaders() }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/coupons`, { headers: getHeaders() }).catch(() => ({ data: [] })),
      ]);
      setProducts(prods.data);
      setOrders(ords.data);
      setUsers(usrs.data);
      setCoupons(cpns.data);
    } catch { toast.error('Failed to load data'); }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('ja_admin_token');
    if (!token) { navigate('/admin/login'); return; }
    axios.get(`${API}/auth/me`, { headers: getHeaders() }).catch(() => navigate('/admin/login'));
    fetchData();
  }, [navigate, fetchData]);

  // Product CRUD
  const openAddProduct = () => { setEditProduct(null); setForm(emptyProduct); setHighlightsStr(''); setDialogType('product'); setDialogOpen(true); };
  const openEditProduct = (p) => {
    const imgs = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : (p.image ? [{ url: p.image, isPrimary: true }] : []);
    setEditProduct(p);
    setForm({ ...p, images: imgs });
    setHighlightsStr(p.highlights?.join(', ') || '');
    setDialogType('product');
    setDialogOpen(true);
  };
  const saveProduct = async () => {
    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const images = (form.images || []).filter(i => i && i.url);
    const primary = images.find(i => i.isPrimary) || images[0];
    const payload = {
      ...form,
      slug,
      highlights: highlightsStr.split(',').map(s => s.trim()).filter(Boolean),
      price: Number(form.price),
      original_price: Number(form.original_price),
      popularity: Number(form.popularity),
      images,
      image: primary?.url || form.image || '',
    };
    try {
      if (editProduct) await axios.put(`${API}/admin/products/${editProduct.id}`, payload, { headers: getHeaders() });
      else await axios.post(`${API}/admin/products`, payload, { headers: getHeaders() });
      toast.success(editProduct ? 'Product updated' : 'Product created');
      setDialogOpen(false); fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setSaving(false); }
  };
  const deleteProduct = async (id) => { if (!window.confirm('Delete product?')) return; try { await axios.delete(`${API}/admin/products/${id}`, { headers: getHeaders() }); toast.success('Deleted'); fetchData(); } catch { toast.error('Failed'); } };

  // Coupon CRUD
  const openAddCoupon = () => { setEditCoupon(null); setCouponForm(emptyCoupon); setDialogType('coupon'); setDialogOpen(true); };
  const openEditCoupon = (c) => { setEditCoupon(c); setCouponForm({ ...c }); setDialogType('coupon'); setDialogOpen(true); };
  const saveCoupon = async () => {
    setSaving(true);
    try {
      if (editCoupon) await axios.put(`${API}/admin/coupons/${editCoupon.id}`, couponForm, { headers: getHeaders() });
      else await axios.post(`${API}/admin/coupons`, couponForm, { headers: getHeaders() });
      toast.success(editCoupon ? 'Coupon updated' : 'Coupon created');
      setDialogOpen(false); fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
    finally { setSaving(false); }
  };
  const deleteCoupon = async (id) => { if (!window.confirm('Delete coupon?')) return; try { await axios.delete(`${API}/admin/coupons/${id}`, { headers: getHeaders() }); toast.success('Deleted'); fetchData(); } catch { toast.error('Failed'); } };

  // User management
  const searchUsers = async () => {
    try { const { data } = await axios.get(`${API}/admin/users?search=${userSearch}`, { headers: getHeaders() }); setUsers(data); } catch {}
  };
  const toggleBlockUser = async (userId) => {
    try { const { data } = await axios.put(`${API}/admin/users/${userId}/block`, {}, { headers: getHeaders() }); toast.success(data.blocked ? 'User blocked' : 'User unblocked'); fetchData(); } catch { toast.error('Failed'); }
  };
  const openViewUser = async (userId) => {
    try { const { data } = await axios.get(`${API}/admin/users/${userId}`, { headers: getHeaders() }); setViewUser(data); setDialogType('user'); setDialogOpen(true); } catch { toast.error('Failed to load user'); }
  };

  const logout = () => { sessionStorage.removeItem('ja_admin_token'); sessionStorage.removeItem('ja_admin_name'); navigate('/admin/login'); };
  const adminName = sessionStorage.getItem('ja_admin_name') || 'Admin';
  const inputCls = "w-full h-10 px-3 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30";

  return (
    <div className="min-h-screen bg-[#edfbf0]">
      <header className="bg-white border-b border-[#cfecd6] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div><h1 className="text-xl font-['Outfit'] font-semibold text-[#233232]">Admin Dashboard</h1><p className="text-xs text-[#8dac96]">Welcome, {adminName}</p></div>
          <button data-testid="admin-logout-btn" onClick={logout} className="flex items-center gap-2 text-sm text-[#4f5958] hover:text-red-500"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Products', value: products.length, icon: Package, color: 'bg-[#3bb44b]/10 text-[#3bb44b]' },
            { label: 'Orders', value: orders.length, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
            { label: 'Users', value: users.length, icon: Users, color: 'bg-purple-50 text-purple-600' },
            { label: 'Coupons', value: coupons.filter(c => c.active).length, icon: Tag, color: 'bg-amber-50 text-amber-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#cfecd6]">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-5 h-5" /></div>
              <p className="text-2xl font-bold text-[#233232] font-['Outfit']">{s.value}</p>
              <p className="text-sm text-[#4f5958]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['products', 'orders', 'users', 'coupons'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-colors whitespace-nowrap ${tab === t ? 'bg-[#3bb44b] text-white' : 'bg-white text-[#4f5958] border border-[#cfecd6]'}`}>{t}</button>
          ))}
        </div>

        {/* Products Tab */}
        {tab === 'products' && (
          <div className="bg-white rounded-2xl border border-[#cfecd6] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#cfecd6]">
              <h2 className="font-['Outfit'] font-semibold text-[#233232]">All Products</h2>
              <button data-testid="add-product-btn" onClick={openAddProduct} className="flex items-center gap-1.5 bg-[#3bb44b] text-white rounded-full px-4 py-2 text-sm font-medium btn-hover-scale"><Plus className="w-4 h-4" /> Add</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#cfecd6]/20 text-[#4f5958]"><th className="text-left px-5 py-3">Product</th><th className="text-left px-5 py-3">Category</th><th className="text-right px-5 py-3">Price</th><th className="text-right px-5 py-3">Actions</th></tr></thead>
                <tbody>{products.map(p => (
                  <tr key={p.id} className="border-t border-[#cfecd6]/50 hover:bg-[#cfecd6]/10">
                    <td className="px-5 py-3 flex items-center gap-3"><div className="w-10 h-14 rounded-lg bg-[#cfecd6]/30 flex items-center justify-center p-1 shrink-0"><img src={resolveImageUrl(getPrimaryImage(p))} alt="" className="w-full h-full object-contain" /></div><span className="font-medium text-[#233232]">{p.name}{p.images?.length > 1 && <span className="ml-2 text-xs bg-[#cfecd6]/60 text-[#4f5958] px-1.5 py-0.5 rounded-full">{p.images.length}</span>}</span></td>
                    <td className="px-5 py-3 text-[#4f5958]">{p.category}</td>
                    <td className="px-5 py-3 text-right font-medium">{"\u20B9"}{p.price}</td>
                    <td className="px-5 py-3 text-right"><button onClick={() => openEditProduct(p)} className="p-1.5 text-[#4f5958] hover:text-[#3bb44b]"><Pencil className="w-4 h-4" /></button><button onClick={() => deleteProduct(p.id)} className="p-1.5 text-[#4f5958] hover:text-red-500 ml-1"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="bg-white rounded-2xl border border-[#cfecd6] overflow-hidden">
            <div className="p-5 border-b border-[#cfecd6]"><h2 className="font-['Outfit'] font-semibold text-[#233232]">All Orders</h2></div>
            {orders.length === 0 ? <div className="p-10 text-center text-[#8dac96]">No orders yet</div> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-[#cfecd6]/20 text-[#4f5958]"><th className="text-left px-5 py-3">Order</th><th className="text-left px-5 py-3">Customer</th><th className="text-left px-5 py-3">Product</th><th className="text-right px-5 py-3">Amount</th><th className="text-center px-5 py-3">Status</th></tr></thead>
                <tbody>{orders.map(o => (
                  <tr key={o.id} className="border-t border-[#cfecd6]/50">
                    <td className="px-5 py-3 font-medium text-[#233232]">{o.id}{o.coupon_code && <span className="ml-2 text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">{o.coupon_code}</span>}</td>
                    <td className="px-5 py-3 text-[#4f5958]">{o.customer_name}</td>
                    <td className="px-5 py-3 text-[#4f5958]">{o.product_name}</td>
                    <td className="px-5 py-3 text-right font-medium">{"\u20B9"}{o.amount}{o.discount > 0 && <span className="text-xs text-[#3bb44b] ml-1">(-{"\u20B9"}{o.discount})</span>}</td>
                    <td className="px-5 py-3 text-center"><Badge className={`text-xs ${o.status === 'paid' ? 'bg-[#3bb44b]/10 text-[#3bb44b]' : o.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>{o.status}</Badge></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-[#cfecd6] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#cfecd6]">
              <h2 className="font-['Outfit'] font-semibold text-[#233232]">Customers ({users.length})</h2>
              <div className="flex gap-2">
                <input data-testid="user-search" value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()}
                  placeholder="Search users..." className="h-9 px-3 rounded-full border border-[#cfecd6] text-sm w-48" />
                <button onClick={searchUsers} className="p-2 bg-[#cfecd6]/40 rounded-full hover:bg-[#cfecd6]"><Search className="w-4 h-4 text-[#4f5958]" /></button>
              </div>
            </div>
            {users.length === 0 ? <div className="p-10 text-center text-[#8dac96]">No users yet</div> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-[#cfecd6]/20 text-[#4f5958]"><th className="text-left px-5 py-3">Name</th><th className="text-left px-5 py-3">Phone</th><th className="text-left px-5 py-3">Email</th><th className="text-center px-5 py-3">Orders</th><th className="text-center px-5 py-3">Status</th><th className="text-right px-5 py-3">Actions</th></tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.id} className="border-t border-[#cfecd6]/50 hover:bg-[#cfecd6]/10" data-testid={`admin-user-${u.id}`}>
                    <td className="px-5 py-3 font-medium text-[#233232]">{u.name || '—'}</td>
                    <td className="px-5 py-3 text-[#4f5958]">{u.phone}</td>
                    <td className="px-5 py-3 text-[#4f5958]">{u.email || '—'}</td>
                    <td className="px-5 py-3 text-center"><Badge className="bg-[#cfecd6]/40 text-[#233232]">{u.order_count || 0}</Badge></td>
                    <td className="px-5 py-3 text-center">{u.blocked ? <Badge className="bg-red-50 text-red-500">Blocked</Badge> : <Badge className="bg-[#3bb44b]/10 text-[#3bb44b]">Active</Badge>}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openViewUser(u.id)} className="p-1.5 text-[#4f5958] hover:text-[#3bb44b]"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => toggleBlockUser(u.id)} className="p-1.5 text-[#4f5958] hover:text-red-500 ml-1">{u.blocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        )}

        {/* Coupons Tab */}
        {tab === 'coupons' && (
          <div className="bg-white rounded-2xl border border-[#cfecd6] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#cfecd6]">
              <h2 className="font-['Outfit'] font-semibold text-[#233232]">Coupons</h2>
              <button data-testid="add-coupon-btn" onClick={openAddCoupon} className="flex items-center gap-1.5 bg-[#3bb44b] text-white rounded-full px-4 py-2 text-sm font-medium btn-hover-scale"><Plus className="w-4 h-4" /> Add Coupon</button>
            </div>
            {coupons.length === 0 ? <div className="p-10 text-center text-[#8dac96]">No coupons created yet</div> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-[#cfecd6]/20 text-[#4f5958]"><th className="text-left px-5 py-3">Code</th><th className="text-left px-5 py-3">Discount</th><th className="text-left px-5 py-3">Min Order</th><th className="text-center px-5 py-3">Used</th><th className="text-center px-5 py-3">Status</th><th className="text-right px-5 py-3">Actions</th></tr></thead>
                <tbody>{coupons.map(c => {
                  const expired = c.expiry && new Date(c.expiry) < new Date();
                  const status = !c.active ? 'Disabled' : expired ? 'Expired' : 'Active';
                  const statusCls = status === 'Active' ? 'bg-[#3bb44b]/10 text-[#3bb44b]' : status === 'Expired' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500';
                  return (
                    <tr key={c.id} className="border-t border-[#cfecd6]/50 hover:bg-[#cfecd6]/10" data-testid={`admin-coupon-${c.id}`}>
                      <td className="px-5 py-3 font-mono font-bold text-[#233232]">{c.code}</td>
                      <td className="px-5 py-3 text-[#4f5958]">{c.discount_value}%{c.max_discount > 0 && ` (max \u20B9${c.max_discount})`}</td>
                      <td className="px-5 py-3 text-[#4f5958]">{c.min_order > 0 ? `\u20B9${c.min_order}` : '—'}</td>
                      <td className="px-5 py-3 text-center">{c.used_count || 0}{c.usage_limit > 0 && `/${c.usage_limit}`}</td>
                      <td className="px-5 py-3 text-center"><Badge className={`text-xs ${statusCls}`}>{status}</Badge></td>
                      <td className="px-5 py-3 text-right"><button onClick={() => openEditCoupon(c)} className="p-1.5 text-[#4f5958] hover:text-[#3bb44b]"><Pencil className="w-4 h-4" /></button><button onClick={() => deleteCoupon(c.id)} className="p-1.5 text-[#4f5958] hover:text-red-500 ml-1"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {dialogType === 'product' && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-[#cfecd6] rounded-3xl">
            <DialogHeader><DialogTitle className="font-['Outfit'] text-[#233232]">{editProduct ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="sm:col-span-2"><label className="text-sm font-medium text-[#233232] mb-1 block">Name *</label><input data-testid="product-form-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-sm font-medium text-[#233232] mb-1 block">Price *</label><input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-sm font-medium text-[#233232] mb-1 block">Original Price</label><input type="number" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))} className={inputCls} /></div>
              <div><label className="text-sm font-medium text-[#233232] mb-1 block">Category</label><input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls} placeholder="Capsules" /></div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-[#233232] mb-1 block">Product Images <span className="text-xs font-normal text-[#8dac96]">(up to 5 · JPG, PNG, WEBP · max 5MB each)</span></label>
                <MultiImageUploader images={form.images || []} onChange={(imgs) => setForm(p => ({ ...p, images: imgs }))} />
              </div>
              <div className="sm:col-span-2"><label className="text-sm font-medium text-[#233232] mb-1 block">Short Description</label><input value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} className={inputCls} /></div>
              <div className="sm:col-span-2"><label className="text-sm font-medium text-[#233232] mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className={`${inputCls} h-auto py-2 resize-none`} /></div>
              <div className="sm:col-span-2"><label className="text-sm font-medium text-[#233232] mb-1 block">Highlights (comma separated)</label><input value={highlightsStr} onChange={e => setHighlightsStr(e.target.value)} className={inputCls} /></div>
              <div className="sm:col-span-2"><label className="text-sm font-medium text-[#233232] mb-1 block">Ingredients</label><textarea value={form.ingredients} onChange={e => setForm(p => ({ ...p, ingredients: e.target.value }))} rows={2} className={`${inputCls} h-auto py-2 resize-none`} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDialogOpen(false)} className="px-5 py-2 rounded-full border border-[#cfecd6] text-[#4f5958] text-sm">Cancel</button>
              <button data-testid="save-product-btn" onClick={saveProduct} disabled={saving} className="px-5 py-2 rounded-full bg-[#3bb44b] text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editProduct ? 'Update' : 'Create'}</button>
            </div>
          </DialogContent>
        )}

        {dialogType === 'coupon' && (
          <DialogContent className="max-w-md bg-white border-[#cfecd6] rounded-3xl">
            <DialogHeader><DialogTitle className="font-['Outfit'] text-[#233232]">{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><label className="text-sm font-medium text-[#233232] mb-1 block">Coupon Code *</label><input data-testid="coupon-form-code" value={couponForm.code} onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className={`${inputCls} font-mono uppercase`} placeholder="AYUR10" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-[#233232] mb-1 block">Discount %</label><input data-testid="coupon-form-value" type="number" value={couponForm.discount_value} onChange={e => setCouponForm(p => ({ ...p, discount_value: Number(e.target.value) }))} className={inputCls} /></div>
                <div><label className="text-sm font-medium text-[#233232] mb-1 block">Max Discount ({"\u20B9"})</label><input type="number" value={couponForm.max_discount} onChange={e => setCouponForm(p => ({ ...p, max_discount: Number(e.target.value) }))} className={inputCls} placeholder="0 = no limit" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-[#233232] mb-1 block">Min Order ({"\u20B9"})</label><input type="number" value={couponForm.min_order} onChange={e => setCouponForm(p => ({ ...p, min_order: Number(e.target.value) }))} className={inputCls} /></div>
                <div><label className="text-sm font-medium text-[#233232] mb-1 block">Usage Limit</label><input type="number" value={couponForm.usage_limit} onChange={e => setCouponForm(p => ({ ...p, usage_limit: Number(e.target.value) }))} className={inputCls} placeholder="0 = unlimited" /></div>
              </div>
              <div><label className="text-sm font-medium text-[#233232] mb-1 block">Expiry Date</label><input type="date" value={couponForm.expiry?.split('T')[0] || ''} onChange={e => setCouponForm(p => ({ ...p, expiry: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className={inputCls} /></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={couponForm.active} onChange={e => setCouponForm(p => ({ ...p, active: e.target.checked }))} className="accent-[#3bb44b] w-4 h-4" /><span className="text-sm text-[#233232]">Active</span></label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDialogOpen(false)} className="px-5 py-2 rounded-full border border-[#cfecd6] text-[#4f5958] text-sm">Cancel</button>
              <button data-testid="save-coupon-btn" onClick={saveCoupon} disabled={saving} className="px-5 py-2 rounded-full bg-[#3bb44b] text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editCoupon ? 'Update' : 'Create'}</button>
            </div>
          </DialogContent>
        )}

        {dialogType === 'user' && viewUser && (
          <DialogContent className="max-w-md bg-white border-[#cfecd6] rounded-3xl">
            <DialogHeader><DialogTitle className="font-['Outfit'] text-[#233232]">Customer Details</DialogTitle></DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-[#8dac96]">Name</span><span className="font-medium text-[#233232]">{viewUser.name || '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8dac96]">Phone</span><span className="font-medium text-[#233232]">{viewUser.phone}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8dac96]">Email</span><span className="font-medium text-[#233232]">{viewUser.email || '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8dac96]">Joined</span><span className="font-medium text-[#233232]">{viewUser.created_at?.split('T')[0]}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8dac96]">Total Orders</span><span className="font-medium text-[#233232]">{viewUser.order_count}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8dac96]">Addresses</span><span className="font-medium text-[#233232]">{viewUser.addresses?.length || 0}</span></div>
              {viewUser.orders?.length > 0 && (
                <div className="pt-3 border-t border-[#cfecd6]">
                  <p className="text-sm font-medium text-[#233232] mb-2">Recent Orders</p>
                  {viewUser.orders.slice(0, 3).map(o => (
                    <div key={o.id} className="flex justify-between text-xs py-1.5 text-[#4f5958]"><span>{o.id} — {o.product_name}</span><span className="font-medium">{"\u20B9"}{o.amount}</span></div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
