import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      axios.get(`${API}/orders/${orderId}`).then(res => setOrder(res.data)).catch(() => {});
    }
  }, [orderId]);

  return (
    <div className="pt-24 pb-16 min-h-[80vh] flex items-center bg-[#edfbf0]">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="w-20 h-20 bg-[#3bb44b]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-[#3bb44b]" />
        </div>
        <h1 className="text-3xl font-semibold text-[#233232] font-['Outfit'] mb-3">Order Placed Successfully!</h1>
        <p className="text-[#4f5958] leading-relaxed mb-6">Thank you for your purchase. Your order is being processed and will be shipped soon in discreet packaging.</p>

        {order && (
          <div className="bg-white rounded-2xl p-6 border border-[#cfecd6] text-left mb-8">
            <h3 className="font-['Outfit'] font-semibold text-[#233232] mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#4f5958]">Order ID</span><span className="font-medium text-[#233232]">{order.id}</span></div>
              <div className="flex justify-between"><span className="text-[#4f5958]">Product</span><span className="font-medium text-[#233232]">{order.product_name}</span></div>
              <div className="flex justify-between"><span className="text-[#4f5958]">Quantity</span><span className="font-medium text-[#233232]">{order.quantity}</span></div>
              <div className="flex justify-between"><span className="text-[#4f5958]">Amount Paid</span><span className="font-bold text-[#3bb44b]">{"\u20B9"}{order.amount?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-[#4f5958]">Status</span><span className="bg-[#3bb44b]/10 text-[#3bb44b] px-2 py-0.5 rounded-full text-xs font-medium capitalize">{order.status}</span></div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/products" className="inline-flex items-center justify-center gap-2 bg-cta-gradient text-white rounded-full px-6 py-3 font-semibold text-sm btn-hover-scale">
            <Package className="w-4 h-4" /> Continue Shopping
          </Link>
          <a href="https://wa.me/918874888221" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-[#cfecd6] text-[#233232] rounded-full px-6 py-3 font-semibold text-sm hover:bg-white">
            Track via WhatsApp <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
