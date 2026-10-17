import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ClipboardList, Star, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Order, type OrderItem } from '@/lib/supabase';
import { getOrderStatus } from '@/lib/orderStatus';
import { formatPrice } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

type OrderHistoryPageProps = {
  onBack: () => void;
  onSignIn: () => void;
};

function getPaymentStatus(status: string, t: (text: string) => string) {
  if (status === 'completed') return { label: t('Pembayaran berhasil'), color: 'bg-emerald-100 text-emerald-800' };
  if (status === 'failed') return { label: t('Pembayaran gagal'), color: 'bg-rose-100 text-rose-800' };
  if (status === 'expired') return { label: t('Kedaluwarsa'), color: 'bg-slate-100 text-slate-700' };
  if (status === 'refunded') return { label: t('Dana dikembalikan'), color: 'bg-slate-100 text-slate-700' };
  return { label: t('Menunggu pembayaran'), color: 'bg-amber-100 text-amber-800' };
}

type ReviewDraft = {
  orderNumber: string;
  productId: string;
  productName: string;
};

export function OrderHistoryPage({ onBack, onSignIn }: OrderHistoryPageProps) {
  const { user, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');
  const [reviewLookupError, setReviewLookupError] = useState('');
  const [paymentSyncError, setPaymentSyncError] = useState('');
  const paymentSyncAttempted = useRef(new Set<string>());
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setReviewedProductIds(new Set());
      setPaymentSyncError('');
      setLoadingOrders(false);
      return;
    }

    let active = true;
    const loadOrders = async () => {
      const [ordersResult, reviewsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, total_amount, status, fulfillment_status, payment_redirect_url, created_at, items_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('product_reviews')
          .select('product_id')
          .eq('user_id', user.id),
      ]);
      if (!active) return;
      let loadedOrders = (ordersResult.data as Order[] | null) ?? [];
      if (ordersResult.error) setError(t('Riwayat pesanan tidak dapat dimuat. Silakan coba lagi.'));
      else {
        setError('');
        const pendingOrders = loadedOrders.filter((order) =>
          order.status === 'pending'
          && order.payment_redirect_url
          && !paymentSyncAttempted.current.has(order.order_number)
        );
        pendingOrders.forEach((order) => paymentSyncAttempted.current.add(order.order_number));
        if (pendingOrders.length > 0) {
          const syncResults = await Promise.all(pendingOrders.map((order) =>
            supabase.functions.invoke('sync-midtrans-order-status', {
              body: { order_number: order.order_number },
            })
          ));
          if (!active) return;
          const syncFailed = syncResults.some((result) => result.error);
          setPaymentSyncError(syncFailed ? t('Payment status could not be verified. Please refresh or contact support before paying again.') : '');
          if (syncResults.some((result) => !result.error)) {
            const refreshedOrders = await supabase
              .from('orders')
              .select('id, order_number, total_amount, status, fulfillment_status, payment_redirect_url, created_at, items_json')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            if (!active) return;
            if (refreshedOrders.error) {
              setError(t('Riwayat pesanan tidak dapat dimuat. Silakan coba lagi.'));
            } else {
              loadedOrders = (refreshedOrders.data as Order[] | null) ?? loadedOrders;
            }
          }
        }
        setOrders(loadedOrders);
      }
      setReviewLookupError(reviewsResult.error ? t('Your reviews could not be loaded. Please try again.') : '');
      setReviewedProductIds(new Set((reviewsResult.data ?? []).map((review) => review.product_id)));
      setLoadingOrders(false);
    };

    setLoadingOrders(true);
    setError('');
    void loadOrders();
    const intervalId = window.setInterval(() => void loadOrders(), 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user, t]);

  const openReviewForm = (order: Order, item: OrderItem, productName: string) => {
    if (!item.product_id) return;
    setReviewDraft({ orderNumber: order.order_number, productId: item.product_id, productName });
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !reviewDraft) return;
    const comment = reviewComment.trim();
    if (!comment) {
      setReviewError(t('Please write a review before submitting.'));
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');
    const authorName = typeof user.user_metadata.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email?.split('@')[0] ?? t('Buyer');
    const { error: insertError } = await supabase.from('product_reviews').insert({
      product_id: reviewDraft.productId,
      user_id: user.id,
      author_name: authorName,
      rating: reviewRating,
      comment,
    });

    if (insertError) {
      setReviewError(t('Failed to submit review. Please try again.'));
      setReviewSubmitting(false);
      return;
    }

    setReviewedProductIds((current) => new Set(current).add(reviewDraft.productId));
    setReviewDraft(null);
    setReviewSubmitting(false);
  };

  if (authLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">{t('Memeriksa akun...')}</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <ClipboardList size={36} className="mx-auto text-slate-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{t('My Orders')}</h1>
        <p className="mt-2 text-sm text-slate-500">{t('Masuk ke akun untuk melihat pesanan Anda.')}</p>
        <button onClick={onSignIn} className="mt-6 rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          {t('Masuk ke akun')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> {t('Kembali ke toko')}
      </button>
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <ClipboardList size={24} className="text-blue-700" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('My Orders')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('Pesanan untuk')} {user.email}</p>
        </div>
      </div>

      {error && <p role="alert" className="mt-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {paymentSyncError && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{paymentSyncError}</p>}
      {loadingOrders ? (
        <p className="py-12 text-center text-sm text-slate-500">{t('Memuat pesanan...')}</p>
      ) : orders.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">{t('Belum ada pesanan.')}</p>
      ) : (
        <div className="divide-y divide-slate-200">
          {orders.map((order) => {
            const progressValue = order.status === 'completed' && order.fulfillment_status === 'waiting_payment'
              ? 'payment_success'
              : order.fulfillment_status;
            const paymentValue = order.status;
            const paymentStatus = getPaymentStatus(paymentValue, t);
            const fulfillmentStatus = getOrderStatus(progressValue);
            return (
              <article key={order.id} className="grid gap-4 border-b border-slate-200 py-5 sm:grid-cols-[1fr_auto] sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{order.order_number}</h2>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatus.color}`}>
                      {paymentStatus.label}
                    </span>
                    {progressValue !== 'waiting_payment' && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${fulfillmentStatus.color}`}>
                        {t('Progres:')} {t(fulfillmentStatus.label)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {order.status === 'pending'
                    && progressValue === 'waiting_payment'
                    && order.payment_redirect_url && (
                    <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                      <p className="text-sm font-medium text-cyan-950">{t('Pembayaran belum terkonfirmasi.')}</p>
                      <p className="mt-1 text-xs text-cyan-900">{t('Buka halaman Midtrans, pilih QRIS, lalu pindai kode QR untuk membayar.')}</p>
                      <a
                        href={order.payment_redirect_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center rounded-md bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-800"
                      >
                        {t('Bayar dengan QRIS')}
                      </a>
                    </div>
                  )}
                  <ul className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                    {(order.items_json ?? []).map((item, index) => {
                      const quantity = item.quantity ?? 1;
                      const unitPrice = item.unit_price ?? item.unitPrice ?? 0;
                      const productName = language === 'en'
                        ? item.product_name_en?.trim() || item.product_name || item.product?.name || t('Product')
                        : item.product_name ?? item.product?.name ?? t('Product');
                      return (
                        <li key={`${item.product_id ?? productName}-${index}`} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-sm">
                          <div>
                            <p className="font-medium text-slate-800">{productName}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.days ? `${item.days} ${t('days')}` : t('Durasi standar')}
                              {item.features ? ` · ${item.features} ${t('features')}` : ''}
                              {` · ${t('Qty')} ${quantity}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-600">{formatPrice(unitPrice * quantity)}</span>
                            {order.status === 'completed'
                              && order.fulfillment_status === 'completed'
                              && item.product_id
                              && (reviewedProductIds.has(item.product_id) ? (
                                <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                  {t('Review Submitted')}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openReviewForm(order, item, productName)}
                                  disabled={Boolean(reviewLookupError)}
                                  className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {t('Write a Review')}
                                </button>
                              ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <p className="text-sm font-semibold text-slate-900 sm:text-right">{formatPrice(order.total_amount)}</p>
              </article>
            );
          })}
        </div>
      )}

      {reviewLookupError && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{reviewLookupError}</p>
      )}

      {reviewDraft && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !reviewSubmitting) setReviewDraft(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 id="review-dialog-title" className="text-lg font-semibold text-slate-900">{t('Rate Product')}</h2>
              <button
                type="button"
                onClick={() => setReviewDraft(null)}
                disabled={reviewSubmitting}
                aria-label={t('Close')}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={(event) => void submitReview(event)}>
              <div className="p-6">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">{reviewDraft.orderNumber}</p>
                  <p className="mt-1 font-semibold text-slate-900">{reviewDraft.productName}</p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-600">{t('Product Quality')}</span>
                  <div className="flex items-center gap-1" role="radiogroup" aria-label={t('Product Quality')}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        role="radio"
                        aria-checked={reviewRating === rating}
                        aria-label={`${rating} ${t('stars')}`}
                        onClick={() => setReviewRating(rating)}
                        className="rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      >
                        <Star
                          size={30}
                          className={rating <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-200 text-slate-200'}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-amber-600">{t([
                    'Very Poor', 'Poor', 'Fair', 'Good', 'Very Good',
                  ][reviewRating - 1])}</span>
                </div>

                <label className="mt-5 block">
                  <span className="sr-only">{t('Write your review')}</span>
                  <textarea
                    required
                    maxLength={2000}
                    rows={6}
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder={t('Share your experience with this product to help other buyers.')}
                    className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                {reviewError && <p role="alert" className="mt-3 text-sm text-rose-600">{reviewError}</p>}
              </div>

              <footer className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setReviewDraft(null)}
                  disabled={reviewSubmitting}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                >
                  {t('Maybe Later')}
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting || !reviewComment.trim()}
                  className="rounded-lg bg-blue-700 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t(reviewSubmitting ? 'Submitting...' : 'Submit Review')}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}