// Image utility helpers for product media (single primary + gallery)
const BACKEND = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Resolve a relative `/api/files/...` URL to the full backend URL.
 * Absolute URLs (https://...) pass through unchanged.
 */
export function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  return url;
}

/**
 * Returns a normalized images array for a product:
 * - Prefers product.images (new schema).
 * - Falls back to product.image (legacy single-image schema).
 * - Always returns at least one entry if any image exists.
 */
export function getProductImages(product) {
  if (!product) return [];
  const arr = Array.isArray(product.images) ? product.images.filter(i => i && i.url) : [];
  if (arr.length > 0) {
    const hasPrimary = arr.some(i => i.isPrimary);
    const out = arr.map((i, idx) => ({
      url: resolveImageUrl(i.url),
      isPrimary: hasPrimary ? !!i.isPrimary : idx === 0,
    }));
    // Move primary to front
    out.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
    return out;
  }
  if (product.image) {
    return [{ url: resolveImageUrl(product.image), isPrimary: true }];
  }
  return [];
}

/** Returns the primary image URL for a product (resolved to full URL). */
export function getPrimaryImage(product) {
  const list = getProductImages(product);
  return list[0]?.url || '';
}
