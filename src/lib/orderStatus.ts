export const orderStatuses = [
  { value: 'waiting_payment', label: 'Menunggu Pembayaran', color: 'bg-amber-100 text-amber-800' },
  { value: 'payment_success', label: 'Pembayaran Berhasil', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'order_received', label: 'Pesanan Diterima', color: 'bg-blue-100 text-blue-800' },
  { value: 'waiting_data', label: 'Menunggu Data', color: 'bg-orange-100 text-orange-800' },
  { value: 'in_progress', label: 'Sedang Dikerjakan', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'review', label: 'Review', color: 'bg-violet-100 text-violet-800' },
  { value: 'revision', label: 'Revisi', color: 'bg-rose-100 text-rose-800' },
  { value: 'completed', label: 'Selesai', color: 'bg-green-100 text-green-800' },
] as const;

export type OrderFulfillmentStatus = (typeof orderStatuses)[number]['value'];

export function getOrderStatus(value: string | null | undefined) {
  return orderStatuses.find((status) => status.value === value) ?? orderStatuses[0];
}
