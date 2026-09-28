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
    setLoadingOrders(true);
    setError('');
    supabase
      .from('orders')
      .select('id, order_number, total_amount, status, fulfillment_status, created_at, items_json')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError('Riwayat pesanan tidak dapat dimuat. Silakan coba lagi.');
        setOrders((data as Order[] | null) ?? []);
        setLoadingOrders(false);
      });

    return () => {
      active = false;
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
            const paymentStatus = getPaymentStatus(order.status);
            const fulfillmentStatus = getOrderStatus(order.fulfillment_status);
            return (
              <article key={order.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{order.order_number}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatus.color}`}>
                      {paymentStatus.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    <span className="mx-2 text-slate-300">|</span>
                    Progres: {fulfillmentStatus.label}
                  </p>
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