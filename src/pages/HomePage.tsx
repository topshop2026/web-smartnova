import { useEffect, useState } from 'react';
import {
  Download,
  Zap,
  Shield,
  Headphones,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { supabase, type Product, type Category } from '@/lib/supabase';
import { getCategoryIcon, isCategoryIconUrl } from '@/lib/icons';
import { ProductCard } from '@/components/ProductCard';
import { useLanguage } from '@/context/LanguageContext';

type HomePageProps = {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onAddToCart: (product: Product) => void;
  onChat: (product: Product) => void;
  onProductClick: (product: Product) => void;
};

export function HomePage({ onNavigate, onAddToCart, onChat, onProductClick }: HomePageProps) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, customers: 0, rating: 4.8 });

  useEffect(() => {
    (async () => {
      const [cats, feat, best, fresh, count] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase
          .from('products')
          .select('*')
          .eq('is_featured', true)
          .order('sales_count', { ascending: false })
          .limit(8),
        supabase
          .from('products')
          .select('*')
          .eq('is_bestseller', true)
          .order('sales_count', { ascending: false })
          .limit(4),
        supabase
          .from('products')
          .select('*')
          .eq('is_new', true)
          .order('created_at', { ascending: false })
          .limit(4),
        supabase.from('products').select('id', { count: 'exact', head: true }),
      ]);

      setCategories(cats.data || []);
      setFeatured(feat.data || []);
      setBestsellers(best.data || []);
      setNewArrivals(fresh.data || []);
      setStats((s) => ({ ...s, products: count.count ?? 0 }));
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950" />
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300 backdrop-blur-sm">
              <Sparkles size={14} className="text-amber-400" />
              {t('Over {count}+ premium digital products').replace('{count}', String(stats.products))}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t('Premium Digital Products')}
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {t('for Creators & Builders')}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
              {t('Discover thousands of high-quality templates, UI kits, courses, graphics, and software. Download instantly and elevate your projects today.')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => onNavigate('catalog')}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30"
              >
                {t('Browse Products')}
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onNavigate('catalog', { filter: 'bestseller' })}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                <TrendingUp size={18} className="text-amber-400" />
                {t('View Bestsellers')}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: Download, label: 'Instant Download', value: '24/7' },
                { icon: Shield, label: 'Secure Checkout', value: '100%' },
                { icon: Headphones, label: 'Customer Support', value: 'Premium' },
                { icon: Zap, label: 'Lifetime Updates', value: 'Free' },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
                >
                  <badge.icon size={20} className="text-blue-400" />
                  <span className="text-xs font-semibold text-white">{badge.value}</span>
                  <span className="text-xs text-slate-400">{t(badge.label)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('Browse by Category')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('Find exactly what you need')}</p>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="hidden items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
          >
            {t('View All')} <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <button
                key={cat.id}
                onClick={() => onNavigate('catalog', { category: cat.slug })}
                className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                  {isCategoryIconUrl(cat.icon) ? (
                    <img src={cat.icon} alt="" className="h-7 w-7 rounded-md object-cover" />
                  ) : (
                    <Icon size={22} />
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('Featured Products')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('Hand-picked by our team')}</p>
          </div>
          <button
            onClick={() => onNavigate('catalog', { filter: 'featured' })}
            className="hidden items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
          >
            {t('View All')} <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 aspect-[4/3] rounded-xl bg-slate-100" />
                <div className="mb-2 h-4 rounded bg-slate-100" />
                <div className="mb-3 h-3 rounded bg-slate-100" />
                <div className="h-6 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onChat={onChat}
                onClick={onProductClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* Value Proposition Banner */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: Download,
              title: 'Instant Delivery',
              desc: 'Download your products immediately after purchase. No waiting, no shipping costs.',
              color: 'blue',
            },
            {
              icon: Shield,
              title: 'Quality Guaranteed',
              desc: 'Every product is reviewed by our team. Not satisfied? Get a full refund within 14 days.',
              color: 'emerald',
            },
            {
              icon: Zap,
              title: 'Lifetime Updates',
              desc: 'Buy once and get free lifetime updates. Always have access to the latest versions.',
              color: 'amber',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  item.color === 'blue'
                    ? 'bg-blue-50 text-blue-600'
                    : item.color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                }`}
              >
                <item.icon size={24} />
              </div>
              <h3 className="text-base font-semibold text-slate-900">{t(item.title)}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{t(item.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={22} className="text-amber-500" />
                  <h2 className="text-2xl font-bold text-slate-900">{t('Bestsellers')}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">{t('Our most popular products')}</p>
              </div>
              <button
                onClick={() => onNavigate('catalog', { filter: 'bestseller' })}
                className="hidden items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
              >
                {t('View All')} <ArrowRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {bestsellers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onChat={onChat}
                  onClick={onProductClick}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={22} className="text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-900">{t('New Arrivals')}</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">{t('Fresh products just added')}</p>
            </div>
            <button
              onClick={() => onNavigate('catalog', { filter: 'new' })}
              className="hidden items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:flex"
            >
              {t('View All')} <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onChat={onChat}
                onClick={onProductClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Stats / CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-cyan-500 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {t('Join thousands of satisfied creators')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            {t('Trusted by designers, developers, and entrepreneurs worldwide')}
          </p>
          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: `${stats.products}+`, label: 'Digital Products' },
              { value: '50K+', label: 'Happy Customers' },
              { value: stats.rating.toString(), label: 'Average Rating' },
              { value: '99%', label: 'Satisfaction' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-blue-100">{t(stat.label)}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-lg transition hover:shadow-xl"
          >
            {t('Start Shopping')}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
