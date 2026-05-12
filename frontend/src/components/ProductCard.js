import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ShoppingBag, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { trackEvent } from '@/components/GoogleAnalytics';
import { getPrimaryImage } from '@/lib/images';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductCard({ product, index, onQuickView }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isLoggedIn, customer, authHeaders, refreshProfile } = useCustomer();
  const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);
  const isWished = isLoggedIn && customer?.wishlist?.includes(product.id);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { toast.info('Login to save to wishlist'); navigate('/auth?redirect=/products'); return; }
    try {
      if (isWished) {
        await axios.delete(`${API}/customer/wishlist/${product.id}`, { headers: authHeaders() });
        toast.success('Removed from wishlist');
      } else {
        await axios.post(`${API}/customer/wishlist/${product.id}`, {}, { headers: authHeaders() });
        toast.success('Added to wishlist');
      }
      refreshProfile();
    } catch { toast.error('Failed to update wishlist'); }
  };

  const handleCardClick = (e) => {
    if (onQuickView) {
      e.preventDefault();
      onQuickView(product);
    }
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    trackEvent('add_to_cart', { product_name: product.name, price: product.price });
    toast.success(`${product.name} added to cart`);
    navigate('/checkout');
  };

  const handleWhatsApp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const message = encodeURIComponent(`Hi, I have a question about ${product.name}.`);
    trackEvent('whatsapp_click', { product_name: product.name });
    window.open(`https://wa.me/918874888221?text=${message}`, '_blank');
  };

  return (
    <div data-testid={`product-card-${product.id}`}
      className={`scroll-reveal scroll-reveal-delay-${(index % 4) + 1} product-card-hover bg-white rounded-2xl overflow-hidden border border-[#cfecd6] shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(e); }}
    >
      <div className="block" data-testid={`product-link-${product.id}`}>
        <div className="product-img-container aspect-square relative overflow-hidden">
          <img src={getPrimaryImage(product)} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
          {discount > 0 && (
            <Badge className="absolute top-3 left-3 bg-[#3bb44b] text-white border-none text-xs font-semibold rounded-full px-3 py-1">{discount}% OFF</Badge>
          )}
          <button data-testid={`wishlist-btn-${product.id}`} onClick={toggleWishlist}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${isWished ? 'bg-red-500 text-white shadow-lg' : 'bg-white/80 text-[#8dac96] hover:text-red-500 hover:bg-white shadow-md'}`}>
            <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.15em] text-[#8dac96] font-medium mb-1">{product.category}</p>
        <h3 className="font-['Outfit'] font-semibold text-[#233232] text-lg leading-snug hover:text-[#3bb44b] transition-colors">{product.name}</h3>
        <p className="text-sm text-[#4f5958] mt-2 leading-relaxed line-clamp-2">{product.short_description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {product.highlights && product.highlights.slice(0, 2).map((h, i) => (
            <span key={i} className="text-xs bg-[#cfecd6]/50 text-[#4f5958] px-2.5 py-1 rounded-full">{h}</span>
          ))}
        </div>
        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-xl font-bold text-[#233232] font-['Outfit']">{"\u20B9"}{product.price.toLocaleString('en-IN')}</span>
          {product.original_price > product.price && (
            <span className="text-sm text-[#8dac96] line-through">{"\u20B9"}{product.original_price.toLocaleString('en-IN')}</span>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button data-testid={`buy-now-btn-${product.id}`} onClick={handleBuyNow}
            className="flex-1 bg-cta-gradient text-white rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 btn-hover-scale">
            <ShoppingBag className="w-3.5 h-3.5" /> Buy Now
          </button>
          <button data-testid={`whatsapp-btn-${product.id}`} onClick={handleWhatsApp}
            className="px-4 py-2.5 rounded-full border border-[#cfecd6] text-[#4f5958] hover:bg-[#cfecd6]/30 transition-colors text-sm flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-[#3bb44b]" />
          </button>
        </div>
      </div>
    </div>
  );
}
