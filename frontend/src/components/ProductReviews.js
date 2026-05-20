import { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Loader2, CheckCircle, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useCustomer } from '@/context/CustomerContext';
import { Badge } from '@/components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductReviews({ product }) {
  const { t } = useTranslation();
  const { isLoggedIn, customer, authHeaders } = useCustomer();
  const [data, setData] = useState({ reviews: [], total: 0, average_rating: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', rating: 5, title: '', comment: '' });

  const fetchReviews = () => {
    setLoading(true);
    axios.get(`${API}/products/${product.id}/reviews`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); /* eslint-disable-next-line */ }, [product?.id]);

  useEffect(() => {
    if (isLoggedIn && customer?.name && !form.name) {
      setForm(f => ({ ...f, name: customer.name }));
    }
  }, [isLoggedIn, customer, form.name]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Please enter your name');
    if (!form.comment.trim() || form.comment.trim().length < 5) return toast.error('Please write at least 5 characters');
    setSubmitting(true);
    try {
      const headers = isLoggedIn ? authHeaders() : {};
      await axios.post(`${API}/reviews`, { product_id: product.id, ...form }, { headers });
      toast.success('Review submitted!', { description: t('reviews.moderation_note') });
      setForm({ name: customer?.name || '', rating: 5, title: '', comment: '' });
      setShowForm(false);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12" data-testid="product-reviews">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#233232] font-['Outfit']">{t('reviews.title')}</h2>
          {data.total > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(data.average_rating) ? 'fill-[#3bb44b] text-[#3bb44b]' : 'text-[#cfecd6]'}`} />
                ))}
              </div>
              <span className="text-sm font-medium text-[#233232]">{data.average_rating}</span>
              <span className="text-sm text-[#8dac96]">({data.total} {data.total === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}
        </div>
        <button
          data-testid="write-review-btn"
          onClick={() => setShowForm(s => !s)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3bb44b] text-white text-sm font-medium btn-hover-scale"
        >
          <MessageSquarePlus className="w-4 h-4" />
          {showForm ? t('cta.cancel') : t('reviews.write')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl p-6 border border-[#cfecd6] mb-6 space-y-4" data-testid="review-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#233232] mb-1.5 block">{t('reviews.your_name')} *</label>
              <input
                data-testid="review-name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-[#cfecd6] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#233232] mb-1.5 block">{t('reviews.rating')} *</label>
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    data-testid={`rating-star-${n}`}
                    onClick={() => setForm({ ...form, rating: n })}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-7 h-7 ${n <= form.rating ? 'fill-[#3bb44b] text-[#3bb44b]' : 'text-[#cfecd6]'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[#233232] mb-1.5 block">{t('reviews.review_title')}</label>
            <input
              data-testid="review-title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border border-[#cfecd6] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#233232] mb-1.5 block">{t('reviews.review_comment')} *</label>
            <textarea
              data-testid="review-comment"
              value={form.comment}
              onChange={e => setForm({ ...form, comment: e.target.value })}
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl border border-[#cfecd6] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3bb44b]/30 resize-none"
            />
          </div>
          <p className="text-xs text-[#8dac96]">{t('reviews.moderation_note')}</p>
          <button
            type="submit"
            data-testid="submit-review-btn"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cta-gradient text-white text-sm font-semibold btn-hover-scale disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('cta.submit')}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="text-center text-[#8dac96] py-8">Loading…</p>
      ) : data.reviews.length === 0 ? (
        <p className="text-center text-[#8dac96] py-10 bg-white rounded-2xl border border-[#cfecd6]">{t('reviews.no_reviews')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.reviews.map((r, i) => (
            <div key={r.id || i} className="bg-white rounded-2xl p-5 border border-[#cfecd6]" data-testid={`review-${i}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#233232]">{r.name}</span>
                    {r.verified_purchase && (
                      <Badge className="bg-[#3bb44b]/10 text-[#3bb44b] text-[10px] font-semibold px-2 py-0 gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> {t('reviews.verified_purchase')}
                      </Badge>
                    )}
                  </div>
                  {r.created_at && !r.is_legacy && (
                    <p className="text-xs text-[#8dac96] mt-0.5">{r.created_at.slice(0,10)}</p>
                  )}
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s < r.rating ? 'fill-[#3bb44b] text-[#3bb44b]' : 'text-[#cfecd6]'}`} />
                  ))}
                </div>
              </div>
              {r.title && <h4 className="font-semibold text-[#233232] text-sm mb-1.5">{r.title}</h4>}
              <p className="text-sm text-[#4f5958] leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
