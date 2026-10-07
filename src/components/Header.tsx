import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X, Zap, Download, UserRound, Languages } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { CategoryIcon } from '@/components/CategoryIcon';
import type { Category } from '@/lib/supabase';

type HeaderProps = {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  currentPage: string;
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
};

export function Header({
  onNavigate,
  currentPage,
  categories,
  searchQuery,
  setSearchQuery,
}: HeaderProps) {
  const { totalItems, setCartOpen } = useCart();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = user?.app_metadata.role === 'admin';
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navItems = [
    { label: 'Home', page: 'home' },
    { label: 'Catalog', page: 'catalog' },
    { label: 'Bestsellers', page: 'catalog', params: { filter: 'bestseller' } },
    { label: 'New Arrivals', page: 'catalog', params: { filter: 'new' } },
    { label: 'Order History', page: 'orders' },
    { label: 'Chat', page: 'chat' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-lg'
            : 'bg-white'
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-slate-900 text-center text-xs font-medium text-slate-300 py-2 px-4">
          <span className="inline-flex items-center gap-1.5">
            <Zap size={12} className="text-amber-400" />
            {t('Flash Sale: Up to 50% off all digital products — Limited time only!')}
          </span>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <button
              onClick={() => onNavigate('home')}
              className="flex shrink-0 items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
                <Download size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Smart<span className="text-blue-600">Nova</span>
              </span>
            </button>

            {/* Search bar */}
            <div className="hidden flex-1 max-w-md md:block">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder={t('Search digital products...')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (currentPage !== 'catalog') onNavigate('catalog');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && currentPage !== 'catalog') onNavigate('catalog');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.page, item.params)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    currentPage === item.page
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {t(item.label)}
                </button>
              ))}
            </nav>

            {/* Cart + Mobile menu */}
            <div className="flex items-center gap-2">
              <label className="flex h-10 items-center gap-1 rounded-xl px-2 text-slate-600 transition hover:bg-slate-100">
                <Languages size={17} aria-hidden="true" />
                <span className="sr-only">{t('Select language')}</span>
                <select
                  aria-label={t('Select language')}
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as 'id' | 'en')}
                  className="w-12 cursor-pointer bg-transparent text-sm font-semibold outline-none"
                >
                  <option value="id">ID</option>
                  <option value="en">EN</option>
                </select>
              </label>
              <button
                onClick={() => onNavigate('account')}
                aria-label={t('Account')}
                title={user?.email ?? t('Sign in')}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-slate-100 ${currentPage === 'account' ? 'text-blue-600' : 'text-slate-600'}`}
              >
                <UserRound size={20} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => onNavigate('admin')}
                  className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:block"
                >
                  {t('Admin')}
                </button>
              )}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="pb-3 md:hidden">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder={t('Search digital products...')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (currentPage !== 'catalog') onNavigate('catalog');
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-72 overflow-y-auto bg-white shadow-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <span className="font-semibold text-slate-900">{t('Menu')}</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="p-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    onNavigate(item.page, item.params);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {t(item.label)}
                </button>
              ))}
              <button
                onClick={() => {
                  onNavigate('account');
                  setMobileMenuOpen(false);
                }}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {user ? t('Account') : t('Sign in')}
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    onNavigate('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {t('Admin pricing')}
                </button>
              )}
            </nav>
            <div className="border-t border-slate-200 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('Categories')}
              </h4>
              <div className="space-y-1">
                {categories.map((cat) => {
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onNavigate('catalog', { category: cat.slug });
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <CategoryIcon value={cat.icon} size={16} className="h-4 w-4 rounded object-cover text-slate-400" />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
