import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CustomerContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('ja_customer_token');

  const authHeaders = useCallback(() => {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await axios.get(`${API}/customer/me`, { headers: { Authorization: `Bearer ${token}` } });
      setCustomer(data);
    } catch (e) {
      // Token invalid/expired — clear it. Logging the type, not the error body, to avoid noisy 401s in console.
      if (e?.response?.status !== 401) console.warn('Profile fetch failed:', e?.response?.status || e?.message);
      localStorage.removeItem('ja_customer_token');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const login = (token, customerData) => {
    localStorage.setItem('ja_customer_token', token);
    setCustomer(customerData);
  };

  const logout = () => {
    localStorage.removeItem('ja_customer_token');
    setCustomer(null);
  };

  const updateProfile = async (updates) => {
    const { data } = await axios.put(`${API}/customer/profile`, updates, { headers: authHeaders() });
    setCustomer(data);
    return data;
  };

  const refreshProfile = () => fetchProfile();

  return (
    <CustomerContext.Provider value={{ customer, loading, login, logout, updateProfile, refreshProfile, getToken, authHeaders, isLoggedIn: !!customer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
}
