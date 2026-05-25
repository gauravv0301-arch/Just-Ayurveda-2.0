import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, Tag as TagIcon, ChevronRight, ArrowLeft, User, Clock, Share2, MessageCircle, Twitter, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveImageUrl } from '@/lib/images';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function readingTime(text = '') {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);
    axios.get(`${API}/blog/${slug}`)
      .then(r => {
        setPost(r.data);
        document.title = r.data.seo_title || `${r.data.title} — Just Ayurveda`;
        const metaSet = (name, content, isProp = false) => {
          const attr = isProp ? 'property' : 'name';
          let m = document.querySelector(`meta[${attr}="${name}"]`);
          if (!m) { m = document.createElement('meta'); m.setAttribute(attr, name); document.head.appendChild(m); }
          m.content = content;
        };
        if (r.data.seo_description) metaSet('description', r.data.seo_description);
        metaSet('og:title', r.data.title, true);
        metaSet('og:description', r.data.seo_description || r.data.excerpt || '', true);
        metaSet('og:type', 'article', true);
        if (r.data.featured_image) metaSet('og:image', resolveImageUrl(r.data.featured_image), true);
        metaSet('og:url', window.location.href, true);
        // JSON-LD Article schema
        const existing = document.getElementById('blog-jsonld');
        if (existing) existing.remove();
        const script = document.createElement('script');
        script.id = 'blog-jsonld';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: r.data.title,
          description: r.data.seo_description || r.data.excerpt,
          image: r.data.featured_image ? [resolveImageUrl(r.data.featured_image)] : undefined,
          datePublished: r.data.published_at,
          dateModified: r.data.updated_at || r.data.published_at,
          author: { '@type': 'Organization', name: r.data.author || 'Just Ayurveda' },
          publisher: { '@type': 'Organization', name: 'Just Ayurveda', logo: { '@type': 'ImageObject', url: `${window.location.origin}/logo.png` } },
          mainEntityOfPage: { '@type': 'WebPage', '@id': window.location.href },
          keywords: (r.data.tags || []).join(', '),
        });
        document.head.appendChild(script);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
    return () => {
      const j = document.getElementById('blog-jsonld');
      if (j) j.remove();
    };
  }, [slug]);

  const share = (channel) => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
    else if (channel === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    else if (channel === 'copy') { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }
  };

  if (loading) return (
    <div className="pt-24 pb-16 max-w-3xl mx-auto px-4">
      <Skeleton className="aspect-[16/9] rounded-2xl skeleton-shimmer mb-6" />
      <Skeleton className="h-10 w-3/4 skeleton-shimmer rounded mb-3" />
      <Skeleton className="h-4 w-1/3 skeleton-shimmer rounded" />
    </div>
  );

  if (!post) return (
    <div className="pt-24 pb-16 text-center">
      <h2 className="text-2xl font-['Outfit'] text-[#233232]">Article not found</h2>
      <Link to="/blog" className="mt-4 inline-block text-[#3bb44b] font-medium">{`← Back to Blog`}</Link>
    </div>
  );

  const rt = readingTime(post.content || '');

  return (
    <article className="pt-24 pb-16 bg-[#edfbf0] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-[#8dac96] mb-6">
          <Link to="/" className="hover:text-[#3bb44b]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-[#3bb44b]">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#233232] truncate">{post.title}</span>
        </nav>

        {post.featured_image && (
          <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-[#cfecd6]/30 mb-8">
            <img src={resolveImageUrl(post.featured_image)} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <header className="mb-8">
          {post.tags?.[0] && (
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[#3bb44b] font-semibold mb-3">
              <TagIcon className="w-3 h-3" /> {post.tags[0]}
            </span>
          )}
          <h1 data-testid="blog-post-title" className="text-3xl sm:text-4xl lg:text-5xl font-['Outfit'] font-semibold text-[#233232] leading-tight">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#8dac96] mt-5">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {post.published_at?.slice(0,10)}</span>
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author || 'Just Ayurveda'}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {rt} min read</span>
          </div>
        </header>

        {post.excerpt && (
          <p className="text-lg text-[#4f5958] leading-relaxed mb-8 border-l-4 border-[#3bb44b] pl-5 italic">{post.excerpt}</p>
        )}

        <div className="legal-content text-[#233232]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {/* Share buttons */}
        <div className="mt-10 pt-6 border-t border-[#cfecd6] flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#233232]"><Share2 className="w-4 h-4 text-[#3bb44b]" /> Share:</span>
          <button data-testid="share-whatsapp" onClick={() => share('whatsapp')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25D366] text-white text-xs font-medium hover:opacity-90">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button data-testid="share-twitter" onClick={() => share('twitter')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-medium hover:opacity-90">
            <Twitter className="w-3.5 h-3.5" /> Tweet
          </button>
          <button data-testid="share-copy" onClick={() => share('copy')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#cfecd6] text-[#4f5958] text-xs font-medium hover:bg-[#cfecd6]/40">
            <Link2 className="w-3.5 h-3.5" /> Copy link
          </button>
        </div>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map(tg => (
              <Link key={tg} to={`/blog?tag=${encodeURIComponent(tg)}`} className="px-3 py-1.5 rounded-full text-xs bg-[#cfecd6]/40 text-[#4f5958] hover:bg-[#cfecd6] transition-colors">#{tg}</Link>
            ))}
          </div>
        )}

        {post.related?.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-['Outfit'] font-semibold text-[#233232] mb-6">{t('blog.related')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {post.related.map(r => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="bg-white rounded-2xl overflow-hidden border border-[#cfecd6] hover:shadow-md transition-shadow group">
                  <div className="aspect-[4/3] bg-[#cfecd6]/30 overflow-hidden">
                    {r.featured_image && <img src={resolveImageUrl(r.featured_image)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                  </div>
                  <div className="p-4">
                    <h4 className="font-['Outfit'] font-semibold text-[#233232] text-sm leading-snug group-hover:text-[#3bb44b]">{r.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Link to="/blog" className="mt-12 inline-flex items-center gap-2 text-sm font-medium text-[#3bb44b]">
          <ArrowLeft className="w-4 h-4" /> All articles
        </Link>
      </div>
    </article>
  );
}
