import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Pencil, Trash2, LogOut, Package, ShoppingCart, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getHeaders() {
  const token = sessionStorage.getItem('ja_admin_token');
  return { Authorization: `Bearer ${token}` };
}

const emptyProduct = { name: '', slug: '', short_description: '', description: '', highlights: [], ingredients: '', usage_guide: '', price: 0, original_price: 0, image: '', category: '', popularity: 50, faqs: [], reviews: [] };

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [highlightsStr, setHighlightsStr] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [prods, ords] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/admin/orders`, { headers: getHeaders() }).catch(() => ({ data: [] }))
      ]);
      setProducts(prods.data);
      setOrders(ords.data);
    } catch {
      toast.error('Failed to load data');
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('ja_admin_token');
    if (!token) { navigate('/admin/login'); return; }
    axios.get(`${API}/auth/me`, { headers: getHeaders() }).catch(() => { navigate('/admin/login'); });
    fetchData();
  }, [navigate, fetchData]);

  const openAdd = () => { setEditProduct(null); setForm(emptyProduct); setHighlightsStr(''); setDialogOpen(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ ...p }); setHighlightsStr(p.highlights?.join(', ') || ''); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const payload = { ...form, slug, highlights: highlightsStr.split(',').map(s => s.trim()).filter(Boolean), price: Number(form.price), original_price: Number(form.original_price), popularity: Number(form.popularity) };
    try {
      if (editProduct) {
        await axios.put(`${API}/admin/products/${editProduct.id}`, payload, { headers: getHeaders() });
        toast.success('Product updated');
      } else {
        await axios.post(`${API}/admin/products`, payload, { headers: getHeaders() });
        toast.success('Product created');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API}/admin/products/${id}`, { headers: getHeaders() });
      toast.success('Product deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const logout = () => { sessionStorage.removeItem('ja_admin_token'); sessionStorage.removeItem('ja_admin_name'); navigate('/admin/login'); };

  const adminName = sessionStorage.getItem('ja_admin_name') || 'Admin';

  return (
    <div className="min-h-screen bg-[#edfbf0]">
      {/* Header */}
      <header className="bg-white border-b border-[#cfecd6] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-['Outfit'] font-semibold text-[#233232]">Admin Dashboard</h1>
            <p className="text-xs text-[#8dac96]">Welcome, {adminName}</p>
          </div>
          <button data-testid="admin-logout-btn" onClick={logout} className="flex items-center gap-2 text-sm text-[#4f5958] hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Products', value: products.length, icon: Package, color: 'bg-[#3bb44b]/10 text-[#3bb44b]' },
            { label: 'Orders', value: orders.length, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
            { label: 'Revenue', value: `\u20B9${orders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.amount || 0), 0).toLocaleString('en-IN')}`, icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Paid Orders', value: orders.filter(o => o.status === 'paid').length, icon: Package, color: 'bg-amber-50 text-amber-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#cfecd6]">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}><stat.icon className="w-5 h-5" /></div>
              <p className="text-2xl font-bold text-[#233232] font-['Outfit']">{stat.value}</p>
              <p className="text-sm text-[#4f5958]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('products')} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tab === 'products' ? 'bg-[#3bb44b] text-white' : 'bg-white text-[#4f5958] border border-[#cfecd6]'}`}>Products</button>
          <button onClick={() => setTab('orders')} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tab === 'orders' ? 'bg-[#3bb44b] text-white' : 'bg-white text-[#4f5958] border border-[#cfecd6]'}`}>Orders</button>
        </div>

        {/* Products Tab */}
        {tab === 'products' && (
          <div className="bg-white rounded-2xl border border-[#cfecd6] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#cfecd6]">
              <h2 className="font-['Outfit'] font-semibold text-[#233232]">All Products</h2>
              <button data-testid="add-product-btn" onClick={openAdd} className="flex items-center gap-1.5 bg-[#3bb44b] text-white rounded-full px-4 py-2 text-sm font-medium btn-hover-scale">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#cfecd6]/20 text-[#4f5958]">
                  <th className="text-left px-5 py-3 font-medium">Product</th>
                  <th className="text-left px-5 py-3 font-medium">Category</th>
                  <th className="text-right px-5 py-3 font-medium">Price</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-t border-[#cfecd6]/50 hover:bg-[#cfecd6]/10" data-testid={`admin-product-${p.id}`}>
                      <td className="px-5 py-3 flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-[#cfecd6]/30" />
                        <span className="font-medium text-[#233232]">{p.name}</span>
                      </td>
                      <td className="px-5 py-3 text-[#4f5958]">{p.category}</td>
                      <td className="px-5 py-3 text-right font-medium text-[#233232]">{"\u20B9"}{p.price}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-[#4f5958] hover:text-[#3bb44b] transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-[#4f5958] hover:text-red-500 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="bg-white rounded-2xl border border-[#cfecd6] overflow-hidden">
            <div className="p-5 border-b border-[#cfecd6]"><h2 className="font-['Outfit'] font-semibold text-[#233232]">Recent Orders</h2></div>
            {orders.length === 0 ? <div className="p-10 text-center text-[#8dac96]">No orders yet</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-[#cfecd6]/20 text-[#4f5958]">
                    <th className="text-left px-5 py-3 font-medium">Order ID</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-left px-5 py-3 font-medium">Product</th>
                    <th className="text-right px-5 py-3 font-medium">Amount</th>
                    <th className="text-center px-5 py-3 font-medium">Status</th>
                  </tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} className="border-t border-[#cfecd6]/50">
                        <td className="px-5 py-3 font-medium text-[#233232]">{o.id}</td>
                        <td className="px-5 py-3 text-[#4f5958]">{o.customer_name}</td>
                        <td className="px-5 py-3 text-[#4f5958]">{o.product_name}</td>
                        <td className="px-5 py-3 text-right font-medium text-[#233232]">{"\u20B9"}{o.amount}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.status === 'paid' ? 'bg-[#3bb44b]/10 text-[#3bb44b]' : o.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>{o.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-[#cfecd6] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-['Outfit'] text-[#233232]">{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-[#233232] mb-1 block">Product Name *</label>
              <input data-testid="product-form-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#233232] mb-1 block">Price *</label>
              <input data-testid="product-form-price" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#233232] mb-1 block">Original Price</label>
              <input type="number" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#233232] mb-1 block">Category</label>
              <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" placeholder="e.g. Capsules" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#233232] mb-1 block">Image URL</label>
              <input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-[#233232] mb-1 block">Short Description</label>
              <input value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-[#233232] mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                className="w-full px-3 py-2 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-[#233232] mb-1 block">Highlights (comma separated)</label>
              <input value={highlightsStr} onChange={e => setHighlightsStr(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" placeholder="Feature 1, Feature 2" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-[#233232] mb-1 block">Ingredients</label>
              <textarea value={form.ingredients} onChange={e => setForm(p => ({ ...p, ingredients: e.target.value }))} rows={2}
                className="w-full px-3 py-2 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-[#233232] mb-1 block">Usage Guide</label>
              <textarea value={form.usage_guide} onChange={e => setForm(p => ({ ...p, usage_guide: e.target.value }))} rows={2}
                className="w-full px-3 py-2 rounded-xl border border-[#cfecd6] text-sm text-[#233232] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setDialogOpen(false)} className="px-5 py-2 rounded-full border border-[#cfecd6] text-[#4f5958] text-sm font-medium hover:bg-[#cfecd6]/20">Cancel</button>
            <button data-testid="save-product-btn" onClick={handleSave} disabled={saving}
              className="px-5 py-2 rounded-full bg-[#3bb44b] text-white text-sm font-medium btn-hover-scale disabled:opacity-60 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {editProduct ? 'Update' : 'Create'} Product
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
