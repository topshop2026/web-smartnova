import { ArrowDownRight, ArrowUpRight, BadgeCheck, CalendarDays, ChartNoAxesCombined, Wallet } from 'lucide-react';
import type { Order } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';
import { getBestSellingProducts, getMonthlyRevenue, getRevenueSummary } from '@/lib/adminRevenue';
import { formatPrice } from '@/lib/utils';

type AdminRevenueOverviewProps = {
  orders: Order[];
};

const chartWidth = 720;
const chartHeight = 210;
const chartPadding = { top: 18, right: 16, bottom: 38, left: 74 };

function compactPrice(value: number, language: 'id' | 'en') {
  return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function AdminRevenueOverview({ orders }: AdminRevenueOverviewProps) {
  const { language, t } = useLanguage();
  const now = new Date();
  const summary = getRevenueSummary(orders, now);
  const monthlyRevenue = getMonthlyRevenue(orders, now, language === 'id' ? 'id-ID' : 'en-US');
  const bestSellingProducts = getBestSellingProducts(orders, language);
  const maxRevenue = Math.max(...monthlyRevenue.map((month) => month.revenue), 1);
  const usableWidth = chartWidth - chartPadding.left - chartPadding.right;
  const usableHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const points = monthlyRevenue.map((month, index) => ({
    ...month,
    x: chartPadding.left + (index / (monthlyRevenue.length - 1)) * usableWidth,
    y: chartPadding.top + usableHeight - (month.revenue / maxRevenue) * usableHeight,
  }));
  const linePath = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
  ).join(' ');
  const lastPoint = points[points.length - 1];
  const areaPath = `${linePath} L ${lastPoint?.x ?? 0} ${chartPadding.top + usableHeight} L ${points[0]?.x ?? 0} ${chartPadding.top + usableHeight} Z`;
  const recentOrders = [...orders]
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 6);
  const axisValues = [1, 0.66, 0.33, 0];
  const maxUnits = Math.max(...bestSellingProducts.map((product) => product.units), 1);
  const dateLocale = language === 'id' ? 'id-ID' : 'en-US';

  const metrics = [
    {
      label: t('Total revenue'),
      value: formatPrice(summary.totalRevenue),
      detail: t('From completed orders'),
      icon: Wallet,
      color: 'border-blue-100 bg-blue-50 text-blue-700',
    },
    {
      label: t("Today's revenue"),
      value: formatPrice(summary.todayRevenue),
      detail: new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium' }).format(now),
      icon: CalendarDays,
      color: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    },
    {
      label: t("This month's revenue"),
      value: formatPrice(summary.monthRevenue),
      detail: new Intl.DateTimeFormat(dateLocale, { month: 'long', year: 'numeric' }).format(now),
      icon: ChartNoAxesCombined,
      color: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
    {
      label: t('Completed orders'),
      value: new Intl.NumberFormat(dateLocale).format(summary.completedCount),
      detail: t('Paid and confirmed'),
      icon: BadgeCheck,
      color: 'border-violet-100 bg-violet-50 text-violet-700',
    },
  ];

  return (
    <section aria-labelledby="revenue-overview-title" className="mb-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="revenue-overview-title" className="text-xl font-bold text-slate-900">
            {t('Revenue overview')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('Revenue is calculated from confirmed, completed payments only.')}
          </p>
        </div>
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
          {t('All time')}
        </span>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className={`rounded-2xl border p-4 shadow-sm ${metric.color}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-600">{metric.label}</p>
              <metric.icon size={18} aria-hidden="true" />
            </div>
            <p className="mt-3 break-words text-xl font-bold text-slate-950 sm:text-2xl">
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">{t('Revenue trend')}</h3>
              <p className="mt-1 text-xs text-slate-500">{t('Monthly revenue for the last 12 months')}</p>
            </div>
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              IDR
            </span>
          </div>
          {summary.completedCount === 0 ? (
            <div className="flex h-52 items-center justify-center rounded-xl bg-slate-50 px-5 text-center text-sm text-slate-500">
              {t('Revenue trends will appear when a payment is completed.')}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-52 min-w-[560px] w-full"
                role="img"
                aria-label={t('Monthly revenue for the last 12 months')}
              >
                {axisValues.map((ratio) => {
                  const y = chartPadding.top + usableHeight * (1 - ratio);
                  return (
                    <g key={ratio}>
                      <line
                        x1={chartPadding.left}
                        x2={chartWidth - chartPadding.right}
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />
                      <text x={chartPadding.left - 9} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                        {compactPrice(maxRevenue * ratio, language)}
                      </text>
                    </g>
                  );
                })}
                <path d={areaPath} fill="url(#revenue-gradient)" />
                <defs>
                  <linearGradient id="revenue-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity=".22" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                {points.map((point, index) => (
                  <g key={`${point.year}-${point.month}`}>
                    <circle cx={point.x} cy={point.y} r="3.5" fill="#2563eb" stroke="white" strokeWidth="2" />
                    {index % 2 === 0 && (
                      <text x={point.x} y={chartHeight - 11} textAnchor="middle" className="fill-slate-500 text-[10px]">
                        {point.label}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="font-semibold text-slate-900">{t('Top-selling products')}</h3>
          <p className="mt-1 text-xs text-slate-500">{t('Based on completed orders')}</p>
          {bestSellingProducts.length === 0 ? (
            <div className="mt-4 flex h-36 items-center justify-center rounded-xl bg-slate-50 px-5 text-center text-sm text-slate-500">
              {t('No completed product sales yet.')}
            </div>
          ) : (
            <ol className="mt-4 space-y-4">
              {bestSellingProducts.map((product, index) => (
                <li key={product.name}>
                  <div className="mb-1.5 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                        {index + 1}
                      </span>
                      <span className="line-clamp-2 text-sm font-medium text-slate-800">{product.name}</span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-slate-600">
                      {product.units} {t('sold')}
                    </span>
                  </div>
                  <div className="ml-8 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                      style={{ width: `${Math.max(5, (product.units / maxUnits) * 100)}%` }}
                    />
                  </div>
                  <p className="ml-8 mt-1 text-xs text-slate-400">{formatPrice(product.revenue)}</p>
                </li>
              ))}
            </ol>
          )}
        </article>
      </div>

      <article className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-5">
          <div>
            <h3 className="font-semibold text-slate-900">{t('Recent transactions')}</h3>
            <p className="mt-1 text-xs text-slate-500">{t('Latest orders and payment statuses')}</p>
          </div>
          <span className="text-xs font-medium text-slate-500">{recentOrders.length} / {orders.length}</span>
        </div>
        {recentOrders.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">{t('No transactions yet.')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t('Date')}</th>
                  <th className="px-5 py-3 font-semibold">{t('Order')}</th>
                  <th className="px-5 py-3 font-semibold">{t('Customer')}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t('Amount')}</th>
                  <th className="px-5 py-3 font-semibold">{t('Payment status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const isCompleted = order.status === 'completed';
                  const isPending = order.status === 'pending';
                  return (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                        {new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium' }).format(new Date(order.created_at))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">{order.order_number}</td>
                      <td className="max-w-48 truncate px-5 py-3 text-slate-600">{order.customer_name}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-800">
                        {formatPrice(Number(order.total_amount))}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700'
                            : isPending
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isCompleted ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {t(order.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
