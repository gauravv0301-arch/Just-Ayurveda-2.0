import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageCircle, ShoppingCart, Leaf, Star, X, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { trackEvent } from '@/components/GoogleAnalytics';

export default function ProductQuickView({ product, open, onClose }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  if (!product) return null;

  const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);

  const handleAddToCart = () => {
    addToCart(product, 1);
    trackEvent('add_to_cart', { product_name: product.name, price: product.price });
    toast.success(`${product.name} added to cart!`, { description: 'View your cart to checkout.' });
  };

  const handleBuyNow = () => {
    addToCart(product, 1);
    trackEvent('buy_now', { product_name: product.name, price: product.price });
    toast.success(`${product.name} added to cart`);
    onClose();
    navigate('/checkout');
  };

  const handleViewDetails = () => {
    onClose();
    navigate(`/product/${product.slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-[#cfecd6] rounded-3xl p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-0">
          {/* Image */}
          <div className="sm:col-span-2 product-img-container aspect-square sm:aspect-auto sm:min-h-[320px] relative">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            {discount > 0 && (
              <Badge className="absolute top-3 left-3 bg-[#3bb44b] text-white border-none text-xs font-semibold rounded-full px-3 py-1">
                {discount}% OFF
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="sm:col-span-3 p-6 flex flex-col">
            <DialogHeader className="text-left space-y-1 mb-0">
              <p className="text-xs uppercase tracking-[0.15em] text-[#8dac96] font-medium">{product.category}</p>
              <DialogTitle className="font-['Outfit'] font-semibold text-[#233232] text-xl leading-snug pr-6">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#4f5958] leading-relaxed !mt-2">
                {product.short_description}
              </DialogDescription>
            </DialogHeader>

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-2xl font-bold text-[#233232] font-['Outfit']">
                {"\u20B9"}{product.price.toLocaleString('en-IN')}
              </span>
              {product.original_price > product.price && (
                <span className="text-sm text-[#8dac96] line-through">
                  {"\u20B9"}{product.original_price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Key Benefits */}
            {product.highlights?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-[#233232] uppercase tracking-wider mb-2">Key Benefits</p>
                <div className="space-y-1.5">
                  {product.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3bb44b] shrink-0" />
                      <span className="text-sm text-[#4f5958]">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients Preview */}
            {product.ingredients && (
              <div className="mt-4 bg-[#cfecd6]/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Leaf className="w-3.5 h-3.5 text-[#3bb44b]" />
                  <span className="text-xs font-semibold text-[#233232] uppercase tracking-wider">Ingredients</span>
                </div>
                <p className="text-xs text-[#4f5958] leading-relaxed line-clamp-2">{product.ingredients}</p>
              </div>
            )}

            {/* 3 CTAs */}
            <div className="mt-auto pt-5 space-y-2.5">
              <div className="flex gap-2">
                <button
                  data-testid="quickview-add-to-cart-btn"
                  onClick={handleAddToCart}
                  className="flex-1 bg-white border-2 border-[#3bb44b] text-[#3bb44b] rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-[#3bb44b]/5 transition-colors btn-hover-scale"
                >
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </button>
                <button
                  data-testid="quickview-buy-now-btn"
                  onClick={handleBuyNow}
                  className="flex-1 bg-cta-gradient text-white rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 btn-hover-scale"
                >
                  <ShoppingBag className="w-4 h-4" /> Buy Now
                </button>
              </div>
              <button
                data-testid="quickview-view-details-btn"
                onClick={handleViewDetails}
                className="w-full text-center py-2 text-sm font-medium text-[#4f5958] hover:text-[#3bb44b] transition-colors flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Full Details
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
