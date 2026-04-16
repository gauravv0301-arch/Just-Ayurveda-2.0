import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/ProductCard';
import ProductQuickView from '@/components/ProductQuickView';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popularity');
  const [category, setCategory] = useState('all');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    params.append('sort', sortBy);
    if (category !== 'all') params.append('category', category);
    axios.get(`${API}/products?${params.toString()}`).then(res => { setProducts(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, [searchQuery, sortBy, category]);

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="pt-20 md:pt-24 pb-16 min-h-screen bg-[#edfbf0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8dac96] font-medium mb-3">Our Collection</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-[#233232] font-['Outfit']">Premium Wellness Products</h1>
          <p className="mt-4 text-base text-[#4f5958] max-w-xl mx-auto">Carefully crafted Ayurvedic formulations for men's vitality, strength, and daily wellness.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger data-testid="category-filter" className="w-36 rounded-full bg-white border-[#cfecd6] text-[#233232] text-sm h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#cfecd6]">
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="text-[#233232] text-sm capitalize">{cat === 'all' ? 'All Products' : cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#8dac96]">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="sort-select" className="w-40 rounded-full bg-white border-[#cfecd6] text-[#233232] text-sm h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#cfecd6]">
                <SelectItem value="popularity" className="text-[#233232] text-sm">Popularity</SelectItem>
                <SelectItem value="price_low" className="text-[#233232] text-sm">Price: Low to High</SelectItem>
                <SelectItem value="price_high" className="text-[#233232] text-sm">Price: High to Low</SelectItem>
                <SelectItem value="newest" className="text-[#233232] text-sm">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {searchQuery && <p className="text-sm text-[#4f5958] mb-6">Results for "<span className="font-medium text-[#3bb44b]">{searchQuery}</span>"</p>}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white border border-[#cfecd6]">
                <Skeleton className="aspect-square w-full skeleton-shimmer" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-3 w-20 skeleton-shimmer rounded-full" />
                  <Skeleton className="h-5 w-3/4 skeleton-shimmer rounded-full" />
                  <Skeleton className="h-4 w-full skeleton-shimmer rounded-full" />
                  <div className="flex gap-2 pt-2"><Skeleton className="h-10 flex-1 skeleton-shimmer rounded-full" /><Skeleton className="h-10 w-14 skeleton-shimmer rounded-full" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16"><p className="text-[#8dac96] text-lg">No products found.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickViewProduct} />
            ))}
          </div>
        )}
      </div>

      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
