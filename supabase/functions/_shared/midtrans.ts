export type OrderPaymentStatus = 'pending' | 'completed' | 'failed' | 'expired' | 'refunded';

export function mapMidtransPaymentStatus(
  transactionStatus: string,
  fraudStatus: string
): OrderPaymentStatus {
  if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
    return 'completed';
  }
  if (transactionStatus === 'expire') return 'expired';
  if (transactionStatus === 'deny' || transactionStatus === 'cancel') return 'failed';
  if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') return 'refunded';
  return 'pending';
}
