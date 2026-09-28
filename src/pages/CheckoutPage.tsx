import { useEffect, useState } from 'react';
import { CheckCircle2, ArrowLeft, Shield, Download, Mail } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';

type CheckoutPageProps = {
  onBack: () => void;
  onAccount: () => void;
  onComplete: () => void;
};

export function CheckoutPage({ onBack, onAccount, onComplete }: CheckoutPageProps) {
  const { items, totalPrice, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [formData, setFormData] = useState({ name: '', phone: '', whatsappConsent: false });
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentResult, setPaymentResult] = useState<{
    orderNumber: string;
    status: string;
    redirectUrl: string | null;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const requestedOrder = new URLSearchParams(window.location.search).get('order_id');
    if (!userId || !requestedOrder) return;

    let attempts = 0;
    const checkOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('order_number, status, payment_redirect_url')
        .eq('order_number', requestedOrder)
        .maybeSingle();
      if (!data) return;

      setPaymentResult({
        orderNumber: data.order_number,
        status: data.status,
        redirectUrl: data.payment_redirect_url,
      });
      if (data.status === 'completed') {
        setOrderNumber(data.order_number);
        setCompleted(true);
        clearCart();
        window.history.replaceState({}, '', window.location.pathname);
        window.clearInterval(intervalId);
      } else if (['failed', 'expired', 'refunded'].includes(data.status)) {
        window.clearInterval(intervalId);
      }
    };
    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (attempts >= 40) window.clearInterval(intervalId);
      else void checkOrder();
    }, 3000);
    void checkOrder();
    return () => window.clearInterval(intervalId);
  }, [userId, clearCart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !user) {
      setError('Sign in and enter your name before continuing.');
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    const customerPhone = phoneDigits.startsWith('0')
      ? `62${phoneDigits.slice(1)}`
      : phoneDigits;
    if (!/^62\d{8,13}$/.test(customerPhone)) {
      setError('Enter a valid WhatsApp number, for example 081234567890.');
      return;
    }
    if (!formData.whatsappConsent) {
      setError('Please agree to receive your payment confirmation on WhatsApp.');
      return;
    }

    setProcessing(true);

    try {
      const { data, error: paymentError } = await supabase.functions.invoke('create-midtrans-payment', {
        body: {
          customer_name: formData.name.trim(),
          customer_phone: customerPhone,
          whatsapp_consent: true,
          items: items.map((item) => ({
            product_id: item.product.id,
            days: item.days,
            features: item.features,
            quantity: item.quantity,
          })),
        },
      });
      if (paymentError) throw paymentError;
      if (!data?.redirect_url) throw new Error('Midtrans did not return a payment URL.');
      window.location.assign(data.redirect_url);
    } catch {
      setError('Unable to start payment. Please check your connection and try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (completed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={48} className="text-emerald-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">Order Confirmed!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Thank you for your purchase. Your payment has been confirmed and your order is complete.
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Order Number</span>
              <span className="font-semibold text-slate-900">{orderNumber}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-900">{user?.email}</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <Mail size={20} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Download links sent to your email
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Your payment is confirmed. Order fulfillment details will be sent to {user?.email}.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              window.history.replaceState({}, '', window.location.pathname);
              onComplete();
            }}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500">Add some products before checking out.</p>
        <button
          onClick={onBack}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Browse Products
        </button>
      </div>
    );
  }

  if (authLoading) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-500">Checking your account...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to continue</h1>
        <p className="mt-2 text-sm text-slate-500">Orders are linked to your account for payment and review verification.</p>
        <button onClick={onAccount} className="mt-6 rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          Sign in or create account
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to Shopping
      </button>

      <h1 className="mb-6 text-3xl font-bold text-slate-900">Checkout</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Customer Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((current) => ({ ...current, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="John Doe"
                  />
                </div>
                <div className="flex flex-col justify-center rounded-lg bg-slate-50 px-4 py-3">
                  <span className="text-xs font-medium text-slate-500">Receipt email</span>
                  <span className="mt-1 text-sm font-semibold text-slate-800">{user.email}</span>
                </div>
                <div>
                  <label htmlFor="checkout-whatsapp" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nomor WhatsApp
                  </label>
                  <input
                    id="checkout-whatsapp"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData((current) => ({ ...current, phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="081234567890"
                  />
                  <p className="mt-1 text-xs text-slate-500">Konfirmasi dikirim setelah pembayaran berhasil.</p>
                  <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      required
                      checked={formData.whatsappConsent}
                      onChange={(e) => setFormData((current) => ({ ...current, whatsappConsent: e.target.checked }))}
                      className="mt-0.5 accent-blue-700"
                    />
                    <span>Saya setuju menerima konfirmasi pembayaran melalui WhatsApp.</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Shield size={18} className="text-emerald-500" />
                <h2 className="text-base font-semibold text-slate-900">Secure payment with Midtrans</h2>
              </div>
              <p className="text-sm text-emerald-900">Payment details are entered on Midtrans's secure checkout page.</p>
            </div>

            {paymentResult?.status === 'pending' && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <span>Payment {paymentResult.orderNumber} is still pending.</span>
                {paymentResult.redirectUrl && (
                  <a href={paymentResult.redirectUrl} className="font-semibold underline">Continue payment</a>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? (
                'Processing...'
              ) : (
                <>
                  <Download size={18} />
                  Complete Purchase — {formatPrice(totalPrice)}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.product.image_url && (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="line-clamp-1 text-sm font-medium text-slate-900">
                      {item.product.name}
                    </span>
                    <span className="text-xs text-slate-400">{item.days} days · {item.features} features · Qty: {item.quantity}</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium text-slate-900">{formatPrice(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Delivery</span>
                <span className="font-medium text-emerald-600">Instant — Free</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-base font-semibold text-slate-900">Total</span>
                <span className="text-base font-bold text-slate-900">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <Download size={16} />
                <span className="font-medium">Instant download after purchase</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
