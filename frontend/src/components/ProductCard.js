import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { trackEvent } from '@/components/GoogleAnalytics';

export default function ProductCard({ product, index }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);

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
      className={`scroll-reveal scroll-reveal-delay-${(index % 4) + 1} product-card-hover bg-white rounded-2xl overflow-hidden border border-[#cfecd6] shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}>
      <Link to={`/product/${product.slug}`} data-testid={`product-link-${product.id}`} className="block">
        <div className="product-img-container aspect-square relative overflow-hidden">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
          {discount > 0 && (
            <Badge className="absolute top-3 left-3 bg-[#3bb44b] text-white border-none text-xs font-semibold rounded-full px-3 py-1">{discount}% OFF</Badge>
          )}
        </div>
      </Link>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.15em] text-[#8dac96] font-medium mb-1">{product.category}</p>
        <Link to={`/product/${product.slug}`} data-testid={`product-name-${product.id}`}>
          <h3 className="font-['Outfit'] font-semibold text-[#233232] text-lg leading-snug hover:text-[#3bb44b] transition-colors">{product.name}</h3>
        </Link>
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
