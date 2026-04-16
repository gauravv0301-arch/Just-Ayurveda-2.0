import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react';

export default function OrderFailedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');

  return (
    <div className="pt-24 pb-16 min-h-[80vh] flex items-center bg-[#edfbf0]">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-semibold text-[#233232] font-['Outfit'] mb-3">Payment Failed</h1>
        <p className="text-[#4f5958] leading-relaxed mb-2">Unfortunately, your payment could not be processed. Don't worry — no amount has been deducted.</p>
        {orderId && <p className="text-sm text-[#8dac96] mb-8">Reference: {orderId}</p>}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/checkout')} data-testid="retry-payment-btn"
            className="inline-flex items-center justify-center gap-2 bg-cta-gradient text-white rounded-full px-6 py-3 font-semibold text-sm btn-hover-scale">
            <RefreshCw className="w-4 h-4" /> Retry Payment
          </button>
          <a href="https://wa.me/918874888221" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-[#cfecd6] text-[#233232] rounded-full px-6 py-3 font-semibold text-sm hover:bg-white">
            <MessageCircle className="w-4 h-4 text-[#3bb44b]" /> Get Help on WhatsApp
          </a>
        </div>

        <Link to="/products" className="inline-block mt-6 text-sm text-[#3bb44b] hover:underline">Back to Products</Link>
      </div>
    </div>
  );
}
