import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Order } from '@/lib/supabase';
import { getOrderStatus } from '@/lib/orderStatus';
import { formatPrice } from '@/lib/utils';

type OrderHistoryPageProps = {
  onBack: () => void;
  onSignIn: () => void;
};

function getPaymentStatus(status: string) {
  if (status === 'completed') return { label: 'Pembayaran berhasil', color: 'bg-emerald-100 text-emerald-800' };
  if (status === 'failed') return { label: 'Pembayaran gagal', color: 'bg-rose-100 text-rose-800' };
  if (status === 'expired') return { label: 'Kedaluwarsa', color: 'bg-slate-100 text-slate-700' };
  if (status === 'refunded') return { label: 'Dana dikembalikan', color: 'bg-slate-100 text-slate-700' };
  return { label: 'Menunggu pembayaran', color: 'bg-amber-100 text-amber-800' };
}

export function OrderHistoryPage({ onBack, onSignIn }: OrderHistoryPageProps) {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    let active = true;
    const loadOrders = async () => {
      const { data, error: queryError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, fulfillment_status, payment_redirect_url, created_at, items_json')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!active) return;
      if (queryError) setError('Riwayat pesanan tidak dapat dimuat. Silakan coba lagi.');
      else {
        setError('');
        setOrders((data as Order[] | null) ?? []);
      }
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
  }, [user]);

  if (authLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">Memeriksa akun...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <ClipboardList size={36} className="mx-auto text-slate-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Riwayat Pemesanan</h1>
        <p className="mt-2 text-sm text-slate-500">Masuk ke akun untuk melihat pesanan Anda.</p>
        <button onClick={onSignIn} className="mt-6 rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          Masuk ke akun
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Kembali ke toko
      </button>
      <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
        <ClipboardList size={24} className="text-blue-700" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Pemesanan</h1>
          <p className="mt-1 text-sm text-slate-500">Pesanan untuk {user.email}</p>
        </div>
      </div>

      {error && <p role="alert" className="mt-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {loadingOrders ? (
        <p className="py-12 text-center text-sm text-slate-500">Memuat pesanan...</p>
      ) : orders.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">Belum ada pesanan.</p>
      ) : (
        <div className="divide-y divide-slate-200">
          {orders.map((order) => {
            const progressValue = order.status === 'completed' && order.fulfillment_status === 'waiting_payment'
              ? 'payment_success'
              : order.fulfillment_status;
            const paymentValue = order.status === 'pending' && progressValue !== 'waiting_payment'
              ? 'completed'
              : order.status;
            const paymentStatus = getPaymentStatus(paymentValue);
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
                        Progres: {fulfillmentStatus.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {order.status === 'pending'
                    && progressValue === 'waiting_payment'
                    && order.payment_redirect_url && (
                    <div className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-3">
                      <p className="text-sm font-medium text-cyan-950">Pembayaran belum terkonfirmasi.</p>
                      <p className="mt-1 text-xs text-cyan-900">Buka halaman Midtrans, pilih QRIS, lalu pindai kode QR untuk membayar.</p>
                      <a
                        href={order.payment_redirect_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center rounded-md bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-800"
                      >
                        Bayar dengan QRIS
                      </a>
                    </div>
                  )}
                  <ul className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                    {(order.items_json ?? []).map((item, index) => {
                      const quantity = item.quantity ?? 1;
                      const unitPrice = item.unit_price ?? item.unitPrice ?? 0;
                      const productName = item.product_name ?? item.product?.name ?? 'Produk';
                      return (
                        <li key={`${item.product_id ?? productName}-${index}`} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-sm">
                          <div>
                            <p className="font-medium text-slate-800">{productName}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.days ? `${item.days} hari` : 'Durasi standar'}
                              {item.features ? ` · ${item.features} fitur` : ''}
                              {` · Qty ${quantity}`}
                            </p>
                          </div>
                          <span className="text-slate-600">{formatPrice(unitPrice * quantity)}</span>
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
    </div>
  );
}