import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, Tag as TagIcon, ChevronRight, ArrowLeft, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveImageUrl } from '@/lib/images';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
        // SEO
        if (r.data.seo_title) document.title = r.data.seo_title;
        else document.title = `${r.data.title} — Just Ayurveda`;
        if (r.data.seo_description) {
          let m = document.querySelector('meta[name="description"]');
          if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
          m.content = r.data.seo_description;
        }
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

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

  return (
    <article className="pt-24 pb-16 bg-[#edfbf0] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#8dac96] mb-6">
          <Link to="/" className="hover:text-[#3bb44b]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-[#3bb44b]">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#233232] truncate">{post.title}</span>
        </nav>

        {/* Featured image */}
        {post.featured_image && (
          <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-[#cfecd6]/30 mb-8">
            <img src={resolveImageUrl(post.featured_image)} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Header */}
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
          </div>
        </header>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-[#4f5958] leading-relaxed mb-8 border-l-4 border-[#3bb44b] pl-5 italic">
            {post.excerpt}
          </p>
        )}

        {/* Content (markdown) */}
        <div className="legal-content text-[#233232]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-[#cfecd6]">
            {post.tags.map(tg => (
              <Link key={tg} to={`/blog?tag=${encodeURIComponent(tg)}`}
                className="px-3 py-1.5 rounded-full text-xs bg-[#cfecd6]/40 text-[#4f5958] hover:bg-[#cfecd6] transition-colors">
                #{tg}
              </Link>
            ))}
          </div>
        )}

        {/* Related */}
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
