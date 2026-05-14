import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, MessageCircle, Star, Leaf, FlaskConical, BookOpen, ChevronRight, ShoppingCart, Heart } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { trackEvent } from '@/components/GoogleAnalytics';
import ProductCard from '@/components/ProductCard';
import ImageGallery from '@/components/ImageGallery';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isLoggedIn, customer, authHeaders, refreshProfile } = useCustomer();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/products/slug/${slug}`).then(res => {
      setProduct(res.data);
      trackEvent('view_item', { product_name: res.data.name, price: res.data.price });
      return axios.get(`${API}/products?category=${res.data.category}`);
    }).then(res => {
      setRelated(res.data.filter(p => p.slug !== slug).slice(0, 3));
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [slug]);

  if (loading) return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4"><div className="grid md:grid-cols-2 gap-8"><Skeleton className="aspect-[4/5] rounded-2xl skeleton-shimmer" /><div className="space-y-4"><Skeleton className="h-6 w-24 skeleton-shimmer rounded-full" /><Skeleton className="h-10 w-3/4 skeleton-shimmer rounded" /><Skeleton className="h-20 w-full skeleton-shimmer rounded" /></div></div></div>
  );

  if (!product) return (
    <div className="pt-24 pb-16 text-center"><h2 className="text-2xl font-['Outfit'] text-[#233232]">Product not found</h2><Link to="/products" className="mt-4 inline-block text-[#3bb44b]">Browse all products</Link></div>
  );

  const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);

  const handleAddToCart = () => {
    addToCart(product, 1);
    trackEvent('add_to_cart', { product_name: product.name, price: product.price });
    toast.success(`${product.name} added to cart!`, { description: 'View your cart to checkout.' });
  };

  const handleBuyNow = () => {
    addToCart(product, 1);
    trackEvent('add_to_cart', { product_name: product.name, price: product.price });
    toast.success(`${product.name} added to cart`);
    navigate('/checkout');
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hi, I'd like to order ${product.name} (\u20B9${product.price}). Please share ordering details.`);
    trackEvent('whatsapp_click', { product_name: product.name });
    window.open(`https://wa.me/918874888221?text=${msg}`, '_blank');
  };

  const isWished = isLoggedIn && customer?.wishlist?.includes(product.id);
  const toggleWishlist = async () => {
    if (!isLoggedIn) { toast.info('Login to save to wishlist'); navigate('/auth?redirect=/product/' + slug); return; }
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

  const tabs = [
    { id: 'description', label: 'About', icon: BookOpen, content: product.description },
    { id: 'ingredients', label: 'Ingredients', icon: Leaf, content: product.ingredients },
    { id: 'usage', label: 'How to Use', icon: FlaskConical, content: product.usage_guide },
  ];

  return (
    <div className="pt-20 md:pt-24 pb-16 bg-[#edfbf0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#8dac96] mb-8">
          <Link to="/" className="hover:text-[#3bb44b]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-[#3bb44b]">Products</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#233232]">{product.name}</span>
        </nav>

        {/* Product */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <ImageGallery
            product={product}
            size="full"
            allowZoom
            className="rounded-3xl aspect-[4/5]"
            badge={discount > 0 && (
              <Badge className="absolute top-4 left-4 z-10 bg-[#3bb44b] text-white border-none text-sm font-semibold rounded-full px-4 py-1.5">
                {discount}% OFF
              </Badge>
            )}
          />

          <div className="flex flex-col">
            <p className="text-xs uppercase tracking-[0.15em] text-[#8dac96] font-medium mb-2">{product.category}</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-[#233232] font-['Outfit'] leading-tight">{product.name}</h1>

            {/* Wishlist button */}
            <button data-testid="product-wishlist-btn" onClick={toggleWishlist}
              className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isWished ? 'bg-red-500/10 text-red-500 border border-red-200' : 'bg-[#cfecd6]/30 text-[#4f5958] border border-[#cfecd6] hover:text-red-500'}`}>
              <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
              {isWished ? 'In Wishlist' : 'Add to Wishlist'}
            </button>

            <p className="text-base text-[#4f5958] mt-3 leading-relaxed">{product.short_description}</p>

            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-3xl font-bold text-[#233232] font-['Outfit']">{"\u20B9"}{product.price.toLocaleString('en-IN')}</span>
              {product.original_price > product.price && <span className="text-lg text-[#8dac96] line-through">{"\u20B9"}{product.original_price.toLocaleString('en-IN')}</span>}
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              {product.highlights.map((h, i) => <span key={i} className="text-sm bg-[#cfecd6]/50 text-[#4f5958] px-3 py-1.5 rounded-full border border-[#cfecd6]">{h}</span>)}
            </div>

            <div className="flex gap-3 mt-8">
              <button data-testid="product-add-to-cart-btn" onClick={handleAddToCart}
                className="bg-white border-2 border-[#3bb44b] text-[#3bb44b] rounded-full py-3.5 px-6 text-base font-semibold flex items-center justify-center gap-2 hover:bg-[#3bb44b]/5 transition-colors btn-hover-scale">
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>
              <button data-testid="product-buy-now-btn" onClick={handleBuyNow}
                className="flex-1 bg-cta-gradient text-white rounded-full py-3.5 text-base font-semibold flex items-center justify-center gap-2 btn-hover-scale shadow-lg shadow-[#3bb44b]/20">
                <ShoppingBag className="w-5 h-5" /> Buy Now
              </button>
              <button data-testid="product-whatsapp-btn" onClick={handleWhatsApp}
                className="px-6 py-3.5 rounded-full border border-[#cfecd6] text-[#4f5958] hover:bg-[#cfecd6]/30 transition-colors flex items-center gap-2 text-base">
                <MessageCircle className="w-5 h-5 text-[#3bb44b]" /> Chat
              </button>
            </div>

            <p className="text-xs text-[#8dac96] mt-4">Discreet packaging. Fast delivery across India.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex gap-2 border-b border-[#cfecd6] mb-6 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} data-testid={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-[#3bb44b] text-[#3bb44b]' : 'border-transparent text-[#4f5958] hover:text-[#233232]'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#cfecd6]">
            <p className="text-[#4f5958] leading-relaxed">{tabs.find(t => t.id === activeTab)?.content}</p>
          </div>
        </div>

        {/* FAQ */}
        {product.faqs?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-[#233232] font-['Outfit'] mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {product.faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-[#cfecd6] rounded-2xl px-5 bg-white data-[state=open]:bg-[#cfecd6]/10">
                  <AccordionTrigger data-testid={`product-faq-${i}`} className="text-sm md:text-base text-[#233232] font-medium hover:no-underline py-4 text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-sm text-[#4f5958] leading-relaxed pb-4">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {/* Reviews */}
        {product.reviews?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-[#233232] font-['Outfit'] mb-6">Customer Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {product.reviews.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-[#cfecd6]" data-testid={`review-${i}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-[#233232]">{r.name}</span>
                    <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className={`w-4 h-4 ${s < r.rating ? 'fill-[#3bb44b] text-[#3bb44b]' : 'text-[#cfecd6]'}`} />)}</div>
                  </div>
                  <p className="text-sm text-[#4f5958] leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold text-[#233232] font-['Outfit'] mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#cfecd6] p-4 z-40 flex gap-3">
        <button data-testid="mobile-sticky-buy-btn" onClick={handleBuyNow}
          className="flex-1 bg-cta-gradient text-white rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
          <ShoppingBag className="w-4 h-4" /> Buy Now — {"\u20B9"}{product.price.toLocaleString('en-IN')}
        </button>
        <button data-testid="mobile-sticky-wa-btn" onClick={handleWhatsApp} className="px-4 py-3 rounded-full border border-[#cfecd6] text-[#3bb44b]">
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
