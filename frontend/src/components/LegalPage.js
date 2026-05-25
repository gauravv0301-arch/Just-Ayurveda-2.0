import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield } from 'lucide-react';

/**
 * Reusable layout for all legal/policy pages.
 *
 * Props:
 *  - title           Page title (h1)
 *  - subtitle        Short tagline
 *  - lastUpdated     Date string like "May 22, 2026"
 *  - metaDescription SEO meta description (≤160 chars)
 *  - content         Markdown string
 */
export default function LegalPage({ title, subtitle, lastUpdated, metaDescription, content }) {
  useEffect(() => {
    document.title = `${title} — Just Ayurveda`;
    if (metaDescription) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
      m.content = metaDescription;
    }
    window.scrollTo(0, 0);
  }, [title, metaDescription]);

  return (
    <div className="pt-24 pb-16 bg-[#edfbf0] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-[#8dac96] mb-6">
          <Link to="/" className="hover:text-[#3bb44b]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#233232]">{title}</span>
        </nav>

        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3bb44b]/10 text-[#3bb44b] text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" /> Legal
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-['Outfit'] font-semibold text-[#233232] leading-tight">{title}</h1>
          {subtitle && <p className="text-base text-[#4f5958] mt-3">{subtitle}</p>}
          {lastUpdated && <p className="text-xs text-[#8dac96] mt-4">Last updated: {lastUpdated}</p>}
        </header>

        <article className="bg-white rounded-3xl border border-[#cfecd6] p-6 sm:p-10 legal-content text-[#233232]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>

        <div className="mt-10 text-center">
          <p className="text-sm text-[#4f5958]">Questions about this policy?</p>
          <Link to="/contact" className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-[#3bb44b] hover:text-[#2e9038]">
            Contact our team <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
