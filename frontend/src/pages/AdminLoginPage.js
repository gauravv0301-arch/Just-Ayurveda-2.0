import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, form);
      sessionStorage.setItem('ja_admin_token', data.token);
      sessionStorage.setItem('ja_admin_name', data.name);
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#3bb44b]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-[#3bb44b]" />
          </div>
          <h1 className="text-2xl font-semibold text-white font-['Outfit']">Admin Panel</h1>
          <p className="text-[#8dac96] text-sm mt-1">Just Ayurveda Management</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#8dac96] mb-1 block">Email</label>
              <input data-testid="admin-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/50" placeholder="admin@justayurveda.in" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#8dac96] mb-1 block">Password</label>
              <input data-testid="admin-password" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/50" placeholder="Enter password" />
            </div>
          </div>
          <button data-testid="admin-login-btn" type="submit" disabled={loading}
            className="w-full mt-6 bg-[#3bb44b] hover:bg-[#61a06c] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
