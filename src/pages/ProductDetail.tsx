import { useEffect, useState } from 'react';
import {
  X,
  ShoppingCart,
  Download,
  Check,
  Star,
  Tag,
  FileText,
  HardDrive,
  TrendingUp,
  ArrowLeft,
  Send,
  MessageCircle,
} from 'lucide-react';
import { supabase, type EditorialTestimonial, type Product, type Review } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { StarRating } from '@/components/StarRating';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedProduct } from '@/lib/productLocalization';
import { getProductImages } from '@/lib/productImages';
import {
  formatPrice,
  calculateDiscount,
  formatNumber,
  getProductPrice,
  getDefaultDurationDays,
  getProductDurations,
} from '@/lib/utils';

type ProductDetailProps = {
  product: Product;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onChat: (product: Product) => void;
};

export function ProductDetail({ product, onClose, onNavigate, onChat }: ProductDetailProps) {
  const { addToCart, setCartOpen } = useCart();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const localizedProduct = getLocalizedProduct(product, language);
  const userId = user?.id;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editorialTestimonials, setEditorialTestimonials] = useState<EditorialTestimonial[]>([]);
  const [testimonialError, setTestimonialError] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasCompletedPurchase, setHasCompletedPurchase] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [days, setDays] = useState(getDefaultDurationDays(product.duration_prices));
  const [features, setFeatures] = useState(1);
  const [added, setAdded] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const productImages = getProductImages(product.image_url, product.image_urls);
  const firstProductImage = productImages[0] ?? '';
  const productImagesKey = productImages.join('\n');
  const [selectedImage, setSelectedImage] = useState(firstProductImage);
  const [failedImages, setFailedImages] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const loadProductDetails = async () => {
      const reviewRequest = supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      const purchaseRequest = userId
        ? supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .contains('items_json', [{ product_id: product.id }])
        : Promise.resolve({ count: 0, data: null, error: null });
      const testimonialRequest = supabase
        .from('editorial_testimonials')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      const [reviewResult, purchaseResult, testimonialResult] = await Promise.all([
        reviewRequest,
        purchaseRequest,
        testimonialRequest,
      ]);
      if (!active) return;
      setReviews(reviewResult.data || []);
      setEditorialTestimonials((testimonialResult.data as EditorialTestimonial[] | null) ?? []);
      setTestimonialError(testimonialResult.error?.message ?? '');
      setHasReviewed((reviewResult.data || []).some((review) => review.user_id === userId));
      setHasCompletedPurchase((purchaseResult.count ?? 0) > 0);
      setLoading(false);
    };
    void loadProductDetails();
    return () => { active = false; };
  }, [product.id, userId]);

  useEffect(() => {
    setSelectedImage(firstProductImage);
    setFailedImages([]);
  }, [product.id, productImagesKey, firstProductImage]);

  const handleAddToCart = () => {
    addToCart(product, { days, features });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, { days, features });
    setCartOpen(true);
  };

  const handleSubmitReview = async () => {
    setReviewError('');
    if (!user || !hasCompletedPurchase) {
      setReviewError(t('A completed purchase of this product is required to leave a review.'));
      return;
    }
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      setReviewError(t('Please fill in your name and comment.'));
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: product.id,
        user_id: user.id,
        author_name: newReview.name.trim(),
        rating: newReview.rating,
        comment: newReview.comment.trim(),
      })
      .select('*')
      .single();

    if (error) {
      setReviewError(t('Failed to submit review. Please try again.'));
      setSubmitting(false);
      return;
    }

    if (data) {
      setReviews((prev) => [data as Review, ...prev]);
      setHasReviewed(true);
      setNewReview({ name: '', rating: 5, comment: '' });
    }
    setSubmitting(false);
  };

  const discount = calculateDiscount(product.price, product.original_price);
  const selectedPrice = getProductPrice(product, days, features);
  const outOfStock = product.stock <= 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center p-0 sm:p-4 sm:py-8">
        <div className="relative w-full max-w-4xl overflow-hidden rounded-none bg-white shadow-2xl sm:rounded-2xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-slate-600 shadow-sm backdrop-blur-sm transition hover:bg-white"
          >
            <X size={20} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-[4/3] bg-slate-100 md:aspect-auto">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={localizedProduct.name}
                  className="h-full w-full object-cover"
                  onError={() => {
                    const unavailable = new Set([...failedImages, selectedImage]);
                    setFailedImages([...unavailable]);
                    setSelectedImage(productImages.find((image) => !unavailable.has(image)) ?? '');
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300">
                  <Download size={64} />
                </div>
              )}

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {product.is_new && (
                  <span className="rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                    {t('New')}
                  </span>
                )}
                {product.is_bestseller && (
                  <span className="rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                    {t('Bestseller')}
                  </span>
                )}
                {discount > 0 && (
                  <span className="rounded-full bg-rose-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                    -{discount}%
                  </span>
                )}
              </div>
            </div>
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-white p-3 md:col-start-1">
                {productImages.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    aria-label={`${t('View product image')} ${index + 1}`}
                    aria-pressed={selectedImage === image}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      selectedImage === image ? 'border-blue-600' : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {failedImages.includes(image) ? (
                      <span className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-500">
                        {t('Unavailable')}
                      </span>
                    ) : (
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={() => setFailedImages((current) => [...new Set([...current, image])])}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="flex flex-col p-6">
              <div className="mb-2 flex items-center gap-2">
                <StarRating rating={product.rating} size={16} />
                <span className="text-sm text-slate-600">
                  {product.rating.toFixed(1)} ({formatNumber(product.review_count)} {t('reviews')})
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">{localizedProduct.name}</h1>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {localizedProduct.description}
              </p>

              {/* Product details */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                  <FileText size={18} className="text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">{t('File Type')}</div>
                    <div className="text-sm font-semibold text-slate-700">
                      {product.file_type || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                  <HardDrive size={18} className="text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">{t('File Size')}</div>
                    <div className="text-sm font-semibold text-slate-700">
                      {product.file_size || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                  <TrendingUp size={18} className="text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">{t('Sales')}</div>
                    <div className="text-sm font-semibold text-slate-700">
                      {formatNumber(product.sales_count)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                  <Download size={18} className="text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">{t('Delivery')}</div>
                    <div className="text-sm font-semibold text-slate-700">{t('Instant')}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  {t('Waktu pengerjaan')}
                  <select
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    {getProductDurations(product.duration_prices).map((option) => (
                      <option key={option.days} value={option.days}>
                        {option.days} {t('days')}
                        {option.surcharge > 0 ? ` (+${formatPrice(option.surcharge)})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  {t('Fitur tambahan')}
                  <select
                    value={features}
                    onChange={(event) => setFeatures(Number(event.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>{count} {t('features')}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Price + Actions */}
              <div className="mt-auto pt-6">
                {outOfStock && (
                  <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                    {t('This product is currently out of stock.')}
                  </p>
                )}
                <div className="mb-4 flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatPrice(selectedPrice)}
                  </span>
                  {product.original_price && (
                    <span className="text-lg text-slate-400 line-through">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={outOfStock}
                    className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold transition sm:text-sm ${
                      added
                        ? 'bg-emerald-500 text-white'
                        : outOfStock
                          ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check size={18} /> {t('Added!')}
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={16} /> {t('Add to Cart')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={outOfStock}
                    className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-2 py-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                  >
                    <Download size={16} /> {t('Buy Now')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onChat(product)}
                    title={`${t('Chat admin tentang')} ${localizedProduct.name}`}
                    className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-2 py-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 sm:text-sm"
                  >
                    <MessageCircle size={16} /> Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews section */}
          <div className="border-t border-slate-200 p-6">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              {t('Customer Reviews')} ({reviews.length})
            </h2>

            {/* Write review */}
            {hasCompletedPurchase && !hasReviewed ? (
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">{t('Write a Review')}</h3>
                <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder={t('Your name')}
                    value={newReview.name}
                    onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                      >
                        <Star
                          size={22}
                          className={
                            star <= newReview.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-200 text-slate-200'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  placeholder={t('Share your thoughts about this product...')}
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                {reviewError && (
                  <p className="text-sm text-rose-600">{reviewError}</p>
                )}
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={14} />
                  {t(submitting ? 'Submitting...' : 'Submit Review')}
                </button>
                </div>
              </div>
            ) : hasCompletedPurchase ? (
              <p className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {t('You have already reviewed this product.')}
              </p>
            ) : (
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {user ? (
                  t('Reviews are available after this product has a completed purchase on your account.')
                ) : (
                  <span>
                    {t('Sign in to check review eligibility.')}{' '}
                    <button onClick={() => onNavigate('account')} className="font-semibold text-blue-700 hover:underline">
                      {t('Sign in')}
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Reviews list */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-slate-200 p-4">
                    <div className="mb-2 h-4 w-32 rounded bg-slate-100" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-slate-500">{t('No reviews yet. Be the first to review!')}</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                          {review.author_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {review.author_name}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size={12} />
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">{review.comment}</p>
                    <span className="mt-2 block text-xs text-slate-400">
                      {new Date(review.created_at).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {testimonialError ? (
            <p role="alert" className="border-t border-slate-200 p-6 text-sm text-rose-700">
              {t('Editorial testimonials could not be loaded.')}
            </p>
          ) : editorialTestimonials.length > 0 ? (
            <section className="border-t border-amber-200 bg-amber-50/50 p-6">
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                {t('Editorial testimonials')}
              </h2>
              <div className="space-y-3">
                {editorialTestimonials.map((testimonial) => (
                  <article key={testimonial.id} className="rounded-xl border border-amber-200 bg-white p-4">
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                      {t('Editorial testimonial')}
                    </span>
                    <blockquote className="mt-3 text-sm leading-relaxed text-slate-700">
                      “{testimonial.quote}”
                    </blockquote>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {testimonial.author_name}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* Back button */}
          <div className="border-t border-slate-200 p-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              {t('Back to Catalog')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
