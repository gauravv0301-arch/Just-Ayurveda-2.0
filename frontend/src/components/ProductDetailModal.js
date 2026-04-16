import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, MessageCircle, Star, Leaf, FlaskConical, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetailModal({ product, open, onClose }) {
  if (!product) return null;

  const discount = Math.round(((product.original_price - product.price) / product.original_price) * 100);

  const handleBuyNow = () => {
    const message = encodeURIComponent(`Hi, I'd like to order ${product.name} (${"\u20B9"}${product.price}). Please share the ordering details.`);
    window.open(`https://wa.me/918874888221?text=${message}`, '_blank');
    toast.success('Redirecting to WhatsApp...');
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hi, I have a question about ${product.name}.`);
    window.open(`https://wa.me/918874888221?text=${message}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-[#cfecd6] rounded-3xl p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="product-img-container aspect-square md:aspect-auto md:min-h-[400px] relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discount > 0 && (
              <Badge className="absolute top-4 left-4 bg-[#3bb44b] text-white border-none text-xs font-semibold rounded-full px-3 py-1">
                {discount}% OFF
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="p-6 md:p-8">
            <DialogHeader>
              <p className="text-xs uppercase tracking-[0.15em] text-[#8dac96] font-medium mb-1">
                {product.category}
              </p>
              <DialogTitle className="font-['Outfit'] font-semibold text-[#233232] text-2xl leading-snug">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#4f5958] mt-2 leading-relaxed">
                {product.short_description}
              </DialogDescription>
            </DialogHeader>

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-5">
              <span className="text-2xl font-bold text-[#233232] font-['Outfit']">
                {"\u20B9"}{product.price.toLocaleString('en-IN')}
              </span>
              {product.original_price > product.price && (
                <span className="text-base text-[#8dac96] line-through">
                  {"\u20B9"}{product.original_price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-2 mt-4">
              {product.highlights.map((h, i) => (
                <span key={i} className="text-xs bg-[#cfecd6]/50 text-[#4f5958] px-3 py-1.5 rounded-full">
                  {h}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                data-testid="modal-buy-now-btn"
                onClick={handleBuyNow}
                className="flex-1 bg-cta-gradient text-white rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 btn-hover-scale"
              >
                <ShoppingBag className="w-4 h-4" />
                Buy Now
              </button>
              <button
                data-testid="modal-whatsapp-btn"
                onClick={handleWhatsApp}
                className="px-5 py-3 rounded-full border border-[#cfecd6] text-[#4f5958] hover:bg-[#cfecd6]/30 transition-colors text-sm flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#3bb44b]" />
                Ask
              </button>
            </div>
          </div>
        </div>

        {/* Details Sections */}
        <div className="px-6 md:px-8 pb-8 space-y-6">
          {/* Description */}
          <div className="bg-[#cfecd6]/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-[#3bb44b]" />
              <h4 className="font-['Outfit'] font-semibold text-[#233232] text-base">About This Product</h4>
            </div>
            <p className="text-sm text-[#4f5958] leading-relaxed">{product.description}</p>
          </div>

          {/* Ingredients */}
          <div className="bg-[#cfecd6]/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-4 h-4 text-[#3bb44b]" />
              <h4 className="font-['Outfit'] font-semibold text-[#233232] text-base">Ingredients</h4>
            </div>
            <p className="text-sm text-[#4f5958] leading-relaxed">{product.ingredients}</p>
          </div>

          {/* Usage Guide */}
          <div className="bg-[#cfecd6]/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-[#3bb44b]" />
              <h4 className="font-['Outfit'] font-semibold text-[#233232] text-base">How to Use</h4>
            </div>
            <p className="text-sm text-[#4f5958] leading-relaxed">{product.usage_guide}</p>
          </div>

          {/* FAQ Accordion */}
          {product.faqs && product.faqs.length > 0 && (
            <div>
              <h4 className="font-['Outfit'] font-semibold text-[#233232] text-base mb-3">
                Frequently Asked Questions
              </h4>
              <Accordion type="single" collapsible className="space-y-2">
                {product.faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border border-[#cfecd6] rounded-xl px-4 data-[state=open]:bg-[#cfecd6]/10"
                  >
                    <AccordionTrigger
                      data-testid={`modal-faq-trigger-${i}`}
                      className="text-sm text-[#233232] font-medium hover:no-underline py-3"
                    >
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-[#4f5958] leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div>
              <h4 className="font-['Outfit'] font-semibold text-[#233232] text-base mb-3">
                Customer Reviews
              </h4>
              <div className="space-y-3">
                {product.reviews.map((review, i) => (
                  <div key={i} className="bg-[#cfecd6]/20 rounded-xl p-4" data-testid={`review-${i}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-[#233232]">{review.name}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s < review.rating ? 'fill-[#3bb44b] text-[#3bb44b]' : 'text-[#cfecd6]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-[#4f5958] leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Mobile CTA */}
        <div className="md:hidden sticky bottom-0 bg-white border-t border-[#cfecd6] p-4 flex gap-3">
          <button
            data-testid="mobile-sticky-buy-btn"
            onClick={handleBuyNow}
            className="flex-1 bg-cta-gradient text-white rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Buy Now — {"\u20B9"}{product.price.toLocaleString('en-IN')}
          </button>
          <button
            data-testid="mobile-sticky-whatsapp-btn"
            onClick={handleWhatsApp}
            className="px-4 py-3 rounded-full border border-[#cfecd6] text-[#3bb44b]"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
