import { useEffect, useState } from 'react';
import { ShoppingCart, Search, Menu, X, UserRound, Languages, Sparkles, ArrowUpRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Category } from '@/lib/supabase';

type HeaderProps = {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  currentPage: string;
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
};

const navItems = [
  { label: 'Home', page: 'home' },
  { label: 'Products', page: 'catalog' },
  { label: 'Services', page: 'services' },
  { label: 'Portfolio', page: 'portfolio' },
  { label: 'About', page: 'about' },
  { label: 'Contact', page: 'contact' },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navigate = (page: string, params?: Record<string, string>) => {
    onNavigate(page, params);
    setMobileMenuOpen(false);
  };

  const searchInput = (
    <div className="header-search">
      <Search size={16} aria-hidden="true" />
      <input
        type="search"
        aria-label={t('Search digital products...')}
        placeholder={t('Search digital products...')}
        value={searchQuery}
        onChange={(event) => {
          setSearchQuery(event.target.value);
          if (currentPage !== 'catalog') navigate('catalog');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && currentPage !== 'catalog') navigate('catalog');
        }}
      />
    </div>
  );

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="site-container header-main">
        <button className="brand-lockup" onClick={() => navigate('home')} aria-label="SmartNova - Beranda">
          <span className="brand-symbol"><Sparkles size={20} /></span>
          <span>Smart<span>Nova</span></span>
        </button>

        <nav className="desktop-nav" aria-label="Navigasi utama">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              className={currentPage === item.page || (item.page === 'catalog' && currentPage === 'catalog') ? 'active' : ''}
              aria-current={currentPage === item.page ? 'page' : undefined}
            >
              {t(item.label)}
            </button>
          ))}
        </nav>

        <div className="header-tools">
          {searchInput}
          <label className="language-switch">
            <Languages size={15} aria-hidden="true" />
            <span className="sr-only">{t('Select language')}</span>
            <select
              aria-label={t('Select language')}
              value={language}
              onChange={(event) => setLanguage(event.target.value as 'id' | 'en')}
            >
              <option value="id">ID</option><option value="en">EN</option>
            </select>
          </label>
          <button className="header-icon-button" onClick={() => navigate('account')} aria-label={t('Account')} title={user?.email ?? t('Sign in')}>
            <UserRound size={18} />
          </button>
          {isAdmin && <button className="header-admin" onClick={() => navigate('admin')}>{t('Admin')}</button>}
          <button className="header-icon-button cart-button" onClick={() => setCartOpen(true)} aria-label={t('Open cart')}>
            <ShoppingCart size={18} />
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </button>
          <button
            className="header-icon-button mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t('Close menu') : t('Open menu')}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <button className="mobile-menu-scrim" onClick={() => setMobileMenuOpen(false)} aria-label={t('Close menu')} />
          <div className="mobile-menu-panel">
            <nav aria-label="Navigasi mobile">
              {navItems.map((item) => (
                <button key={item.page} onClick={() => navigate(item.page)}>
                  {t(item.label)}<ArrowUpRight size={15} />
                </button>
              ))}
              <button onClick={() => navigate('orders')}>{t('My Orders')}<ArrowUpRight size={15} /></button>
              <button onClick={() => navigate('chat')}>{t('Chat')}<ArrowUpRight size={15} /></button>
              {isAdmin && <button onClick={() => navigate('admin')}>{t('Admin')}<ArrowUpRight size={15} /></button>}
            </nav>
            {searchInput}
            {categories.length > 0 && (
              <div className="mobile-category-list">
                <span>{t('Categories')}</span>
                {categories.map((category) => (
                  <button key={category.id} onClick={() => navigate('catalog', { category: category.slug })}>{category.name}</button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
