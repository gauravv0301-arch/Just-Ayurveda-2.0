import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductImages } from '@/lib/images';

/**
 * ImageGallery — Responsive product image gallery
 *
 * Props:
 *  - product: product object (uses images[] or falls back to image)
 *  - size: "compact" (quick view) | "full" (detail page)
 *  - className: container classes (e.g., aspect-square rounded-3xl overflow-hidden)
 *  - badge: optional ReactNode rendered absolute top-left of main image (e.g., discount badge)
 *  - actions: optional ReactNode rendered absolute top-right of main image (e.g., wishlist btn)
 *  - allowZoom: enable cursor zoom on hover (full size only)
 */
export default function ImageGallery({ product, size = 'full', className = '', badge, actions, allowZoom = false }) {
  const images = getProductImages(product);
  const [active, setActive] = useState(0);
  const [zoomPos, setZoomPos] = useState(null);
  const touchStartX = useRef(null);

  useEffect(() => { setActive(0); }, [product?.id]);

  if (images.length === 0) {
    return (
      <div className={`bg-[#cfecd6]/30 flex items-center justify-center ${className}`}>
        <span className="text-[#8dac96] text-sm">No image</span>
      </div>
    );
  }

  const go = (dir) => {
    setActive((a) => (a + dir + images.length) % images.length);
  };

  const handleMouseMove = (e) => {
    if (!allowZoom) return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoomPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const main = images[active];

  return (
    <div className="flex flex-col gap-3" data-testid="image-gallery">
      {/* Main image */}
      <div
        className={`relative product-img-container overflow-hidden ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomPos(null)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={main.url}
          alt=""
          loading="lazy"
          data-testid={`gallery-main-${active}`}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            allowZoom && zoomPos ? 'scale-150' : 'scale-100'
          }`}
          style={allowZoom && zoomPos ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
        />
        {badge}
        {actions}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              data-testid="gallery-prev"
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-[#233232] hover:text-[#3bb44b]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              data-testid="gallery-next"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-[#233232] hover:text-[#3bb44b]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className={`flex gap-2 ${size === 'compact' ? 'overflow-x-auto' : 'flex-wrap'}`}>
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              data-testid={`gallery-thumb-${i}`}
              className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                size === 'compact' ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20'
              } ${i === active ? 'border-[#3bb44b] ring-2 ring-[#3bb44b]/20' : 'border-[#cfecd6] hover:border-[#3bb44b]/60'}`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
