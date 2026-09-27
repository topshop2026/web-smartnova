export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function getProductPrice(
  product: {
    price: number;
    feature_price?: number;
    duration_prices?: { days: number; surcharge: number }[];
  },
  days: number,
  features: number
): number {
  const duration = getProductDurations(product.duration_prices).find((option) => option.days === days);
  const featurePrice = Number(product.feature_price);
  return product.price + (Number.isFinite(featurePrice) ? featurePrice : 0) * features
    + (duration?.surcharge ?? 0);
}

export function getProductDurations(
  durationPrices?: { days: number; surcharge: number }[]
): { days: number; surcharge: number }[] {
  return durationPrices?.length ? durationPrices : [
    { days: 1, surcharge: 0 },
    { days: 2, surcharge: 0 },
    { days: 3, surcharge: 0 },
    { days: 7, surcharge: 0 },
    { days: 14, surcharge: 0 },
  ];
}

export function getDefaultDurationDays(durationPrices?: { days: number }[]): number {
  const options = durationPrices?.length ? durationPrices : [{ days: 7 }];
  return options.find((option) => option.days === 7)?.days
    ?? options[options.length - 1]?.days
    ?? 7;
}

export function getCartItemKey(item: { product: { id: string }; days: number; features: number }): string {
  return `${item.product.id}:${item.days}:${item.features}`;
}

export function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return n.toString();
}

export function calculateDiscount(price: number, original: number | null): number {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export function generateOrderNumber(): string {
  const date = new Date();
  const ymd = date.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SN-${ymd}-${random}`;
}
