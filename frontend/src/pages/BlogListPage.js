import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Tag as TagIcon, Search, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveImageUrl } from '@/lib/images';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BlogListPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tag) params.set('tag', tag);
    if (search) params.set('search', search);
    axios.get(`${API}/blog?${params.toString()}`)
      .then(r => setPosts(r.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [tag, search]);

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="pt-24 pb-16 bg-[#edfbf0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[#3bb44b] font-medium mb-3">JUST AYURVEDA</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-['Outfit'] font-semibold text-[#233232] leading-tight">{t('blog.title')}</h1>
          <p className="text-base text-[#4f5958] mt-4 max-w-2xl mx-auto">{t('blog.tagline')}</p>
        </header>

        {/* Search + Tag filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8dac96]" />
            <input
              type="text"
              data-testid="blog-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="w-full h-11 pl-10 pr-4 rounded-full border border-[#cfecd6] bg-white text-sm text-[#233232] placeholder-[#8dac96] focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setTag('')}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  !tag ? 'bg-[#3bb44b] text-white' : 'bg-white border border-[#cfecd6] text-[#4f5958]'
                }`}
              >
                All
              </button>
              {allTags.map(tg => (
                <button
                  key={tg}
                  onClick={() => setTag(tg)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                    tag === tg ? 'bg-[#3bb44b] text-white' : 'bg-white border border-[#cfecd6] text-[#4f5958]'
                  }`}
                >
                  {tg}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="aspect-[4/3] rounded-2xl skeleton-shimmer" />)}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-[#8dac96] py-16">{t('blog.no_posts')}</p>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <Link to={`/blog/${featured.slug}`} data-testid="blog-featured" className="block mb-12 group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl overflow-hidden border border-[#cfecd6] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-shadow">
                  <div className="aspect-[4/3] md:aspect-auto overflow-hidden bg-[#cfecd6]/30">
                    {featured.featured_image ? (
                      <img src={resolveImageUrl(featured.featured_image)} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8dac96]">No image</div>
                    )}
                  </div>
                  <div className="p-6 md:p-10 flex flex-col justify-center">
                    <span className="text-xs uppercase tracking-[0.2em] text-[#3bb44b] font-semibold mb-3">Featured</span>
                    <h2 className="text-2xl md:text-3xl font-['Outfit'] font-semibold text-[#233232] mb-4 group-hover:text-[#3bb44b] transition-colors">{featured.title}</h2>
                    <p className="text-base text-[#4f5958] leading-relaxed mb-4">{featured.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-[#8dac96] mb-4">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {featured.published_at?.slice(0,10)}</span>
                      {featured.tags?.[0] && <span className="flex items-center gap-1.5"><TagIcon className="w-3.5 h-3.5" /> {featured.tags[0]}</span>}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3bb44b]">{t('blog.read_more')} <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </div>
              </Link>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map(p => (
                  <Link key={p.id} to={`/blog/${p.slug}`} data-testid={`blog-card-${p.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-[#cfecd6] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow flex flex-col">
                    <div className="aspect-[4/3] bg-[#cfecd6]/30 overflow-hidden">
                      {p.featured_image ? (
                        <img src={resolveImageUrl(p.featured_image)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8dac96] text-sm">No image</div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      {p.tags?.[0] && <span className="text-xs uppercase tracking-[0.15em] text-[#3bb44b] font-medium mb-2">{p.tags[0]}</span>}
                      <h3 className="font-['Outfit'] font-semibold text-[#233232] text-lg leading-snug group-hover:text-[#3bb44b] transition-colors">{p.title}</h3>
                      <p className="text-sm text-[#4f5958] leading-relaxed mt-2 line-clamp-3 flex-1">{p.excerpt}</p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#cfecd6]/60">
                        <span className="text-xs text-[#8dac96]">{p.published_at?.slice(0,10)}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3bb44b]">{t('blog.read_more')} <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
