import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Phone, Mail, Lock, User, Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomer } from '@/context/CustomerContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useCustomer();
  const [method, setMethod] = useState('phone'); // phone | email
  const [mode, setMode] = useState('login'); // login | register
  const [otpStep, setOtpStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const redirect = searchParams.get('redirect') || '/account';

  const onSuccess = (token, customer) => {
    login(token, customer);
    toast.success(`Welcome${customer.name ? ', ' + customer.name : ''}!`);
    navigate(redirect);
  };

  const sendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 10) { toast.error('Enter a valid phone number'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/customer/send-otp`, { phone });
      setOtpStep('otp');
      toast.success('OTP sent!', { description: `Dev OTP: ${data.dev_otp}` });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/customer/verify-otp`, { phone, otp, name });
      onSuccess(data.token, data.customer);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const emailAuth = async () => {
    if (!email || !password) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!name) { toast.error('Name is required'); setLoading(false); return; }
        const { data } = await axios.post(`${API}/customer/register-email`, { name, email, password, phone });
        onSuccess(data.token, data.customer);
      } else {
        const { data } = await axios.post(`${API}/customer/login-email`, { email, password });
        onSuccess(data.token, data.customer);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Authentication failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="pt-20 md:pt-24 pb-16 min-h-screen bg-[#edfbf0] flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-[#233232] font-['Outfit']">Welcome</h1>
          <p className="text-[#4f5958] text-sm mt-1">Sign in for faster checkout and order tracking</p>
        </div>

        {/* Method Tabs */}
        <div className="flex gap-2 mb-6 bg-[#cfecd6]/30 p-1 rounded-full">
          <button onClick={() => { setMethod('phone'); setOtpStep('phone'); }} data-testid="auth-tab-phone"
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${method === 'phone' ? 'bg-white text-[#233232] shadow-sm' : 'text-[#4f5958]'}`}>
            <Phone className="w-4 h-4" /> Phone OTP
          </button>
          <button onClick={() => setMethod('email')} data-testid="auth-tab-email"
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${method === 'email' ? 'bg-white text-[#233232] shadow-sm' : 'text-[#4f5958]'}`}>
            <Mail className="w-4 h-4" /> Email
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#cfecd6]">
          {/* Phone OTP */}
          {method === 'phone' && (
            <div className="space-y-4">
              {otpStep === 'phone' ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-[#233232] mb-1 block">Phone Number</label>
                    <input data-testid="auth-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
                      className="w-full h-12 px-4 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" />
                  </div>
                  <button data-testid="send-otp-btn" onClick={sendOtp} disabled={loading}
                    className="w-full bg-cta-gradient text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 btn-hover-scale disabled:opacity-60">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Send OTP</>}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center mb-2">
                    <KeyRound className="w-8 h-8 text-[#3bb44b] mx-auto mb-2" />
                    <p className="text-sm text-[#4f5958]">OTP sent to <strong className="text-[#233232]">{phone}</strong></p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#233232] mb-1 block">Enter OTP</label>
                    <input data-testid="auth-otp" value={otp} onChange={e => { if (/^\d{0,6}$/.test(e.target.value)) setOtp(e.target.value); }}
                      placeholder="Enter 6-digit OTP" maxLength={6} inputMode="numeric"
                      className="w-full h-12 px-4 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#233232] mb-1 block">Your Name <span className="text-[#8dac96] font-normal">(for new accounts)</span></label>
                    <input data-testid="auth-name-otp" value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                      className="w-full h-12 px-4 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" />
                  </div>
                  <button data-testid="verify-otp-btn" onClick={verifyOtp} disabled={loading}
                    className="w-full bg-cta-gradient text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 btn-hover-scale disabled:opacity-60">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
                  </button>
                  <button onClick={() => { setOtpStep('phone'); setOtp(''); }} className="w-full text-center text-sm text-[#8dac96] hover:text-[#3bb44b]">
                    Change phone number
                  </button>
                </>
              )}
            </div>
          )}

          {/* Email */}
          {method === 'email' && (
            <div className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="text-sm font-medium text-[#233232] mb-1 block">Full Name</label>
                  <input data-testid="auth-name-email" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                    className="w-full h-12 px-4 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-[#233232] mb-1 block">Email</label>
                <input data-testid="auth-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                  className="w-full h-12 px-4 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#233232] mb-1 block">Password</label>
                <input data-testid="auth-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"
                  className="w-full h-12 px-4 rounded-xl border border-[#cfecd6] bg-white text-[#233232] placeholder-[#8dac96] text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30" />
              </div>
              <button data-testid="email-auth-btn" onClick={emailAuth} disabled={loading}
                className="w-full bg-cta-gradient text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 btn-hover-scale disabled:opacity-60">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'register' ? 'Create Account' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-[#4f5958]">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-[#3bb44b] font-medium hover:underline">
                  {mode === 'login' ? 'Register' : 'Sign In'}
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#8dac96] mt-4">Guest checkout is always available. No account needed to place an order.</p>
      </div>
    </div>
  );
}
