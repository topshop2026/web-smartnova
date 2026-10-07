import type { Order, OrderItem } from '@/lib/supabase';

export type RevenueProduct = {
  name: string;
  units: number;
  revenue: number;
};

function getPaymentDate(order: Order): Date {
  return new Date(order.payment_completed_at ?? order.created_at);
}

export function getRevenueOrders(orders: Order[]): Order[] {
  return orders.filter((order) => order.status === 'completed');
}

export function getRevenueSummary(orders: Order[], now = new Date()) {
  const completedOrders = getRevenueOrders(orders);
  const todayKey = toLocalDateKey(now);
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayOrders = completedOrders.filter((order) => toLocalDateKey(getPaymentDate(order)) === todayKey);
  const monthOrders = completedOrders.filter((order) => {
    const paidAt = getPaymentDate(order);
    return `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}` === currentMonthKey;
  });

  return {
    totalRevenue: completedOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0),
    todayRevenue: todayOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0),
    monthRevenue: monthOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0),
    completedCount: completedOrders.length,
  };
}

export function getMonthlyRevenue(orders: Order[], now = new Date(), locale = 'id-ID') {
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date),
      revenue: 0,
    };
  });
  const monthIndices = new Map(months.map((month, index) => [`${month.year}-${month.month}`, index]));

  for (const order of getRevenueOrders(orders)) {
    const date = getPaymentDate(order);
    const monthIndex = monthIndices.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (monthIndex !== undefined) months[monthIndex].revenue += Number(order.total_amount || 0);
  }

  return months;
}

export function getBestSellingProducts(orders: Order[], language: 'id' | 'en' = 'id'): RevenueProduct[] {
  const products = new Map<string, RevenueProduct>();
  for (const order of getRevenueOrders(orders)) {
    for (const item of order.items_json ?? []) {
      const productName = getOrderItemName(item, language);
      const units = Number(item.quantity ?? 1);
      const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
      const product = products.get(productName) ?? { name: productName, units: 0, revenue: 0 };
      product.units += units;
      product.revenue += units * unitPrice;
      products.set(productName, product);
    }
  }
  return [...products.values()].sort((left, right) => right.units - left.units).slice(0, 5);
}

export function getOrderItemName(item: OrderItem, language: 'id' | 'en' = 'id'): string {
  if (language === 'en' && item.product_name_en?.trim()) return item.product_name_en.trim();
  return item.product_name ?? item.product?.name ?? 'Produk';
}

function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
