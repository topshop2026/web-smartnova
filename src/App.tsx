import { useState, useEffect, useCallback } from 'react';
import { CartProvider, useCart } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { supabase, type Product, type Category } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { HomePage } from '@/pages/HomePage';
import { BusinessPage } from '@/pages/BusinessPage';
import { CatalogPage } from '@/pages/CatalogPage';
import { ProductDetail } from '@/pages/ProductDetail';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { AccountPage } from '@/pages/AccountPage';
import { OrderHistoryPage } from '@/pages/OrderHistoryPage';
import { ChatPage } from '@/pages/ChatPage';
import { AdminPage } from '@/pages/AdminPage';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';

type Page =
  | 'home'
  | 'catalog'
  | 'checkout'
  | 'account'
  | 'orders'
  | 'chat'
  | 'admin'
  | 'product'
  | 'services'
  | 'portfolio'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'refund'
  | 'not-found';

function getPageFromLocation(): Page {
  if (new URLSearchParams(window.location.search).has('order_id')) return 'checkout';
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (/^\/products\/[^/]+$/.test(path)) return 'product';
  const routes: Record<string, Page> = {
    '/': 'home',
    '/catalog': 'catalog',
    '/checkout': 'checkout',
    '/account': 'account',
    '/orders': 'orders',
    '/chat': 'chat',
    '/admin': 'admin',
    '/services': 'services',
    '/portfolio': 'portfolio',
    '/about': 'about',
    '/contact': 'contact',
    '/privacy': 'privacy',
    '/terms': 'terms',
    '/refund': 'refund',
  };
  return routes[path] ?? 'not-found';
}

function AppContent() {
  const [page, setPage] = useState<Page>(getPageFromLocation);
  const [pageParams, setPageParams] = useState<Record<string, string>>(() =>
    Object.fromEntries(new URLSearchParams(window.location.search))
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productLoadError, setProductLoadError] = useState('');
  const { addToCart, setCartOpen } = useCart();
  const { language } = useLanguage();

  useEffect(() => {
    const pageTitles: Record<Page, [string, string]> = {
      home: ['Solusi Digital untuk Bisnis', 'Digital Solutions for Business'],
      catalog: ['Produk Digital', 'Digital Products'],
      checkout: ['Pemesanan', 'Checkout'],
      account: ['Akun', 'Account'],
      orders: ['Riwayat Pesanan', 'Order History'],
      chat: ['Chat Dukungan', 'Support Chat'],
      admin: ['Dashboard Admin', 'Admin Dashboard'],
      product: ['Detail Produk', 'Product Details'],
      services: ['Jasa Software Engineering', 'Software Engineering Services'],
      portfolio: ['Portofolio', 'Portfolio'],
      about: ['Tentang SmartNova', 'About SmartNova'],
      contact: ['Konsultasi Proyek', 'Project Consultation'],
      privacy: ['Kebijakan Privasi', 'Privacy Policy'],
      terms: ['Syarat Layanan', 'Terms of Service'],
      refund: ['Kebijakan Refund', 'Refund Policy'],
      'not-found': ['Halaman Tidak Ditemukan', 'Page Not Found'],
    };
    const title = pageTitles[page][language === 'id' ? 0 : 1];
    const documentTitle = selectedProduct
      ? `${selectedProduct.name} | SmartNova`
      : `${title} | SmartNova`;
    document.title = documentTitle;
    const pageDescription = selectedProduct
      ? selectedProduct.description
      : page === 'home'
        ? 'SmartNova menghadirkan produk digital dan layanan software engineering untuk membantu individu dan UMKM bekerja lebih efisien.'
        : `${title} SmartNova. Temukan solusi digital, produk, dan layanan yang sesuai dengan kebutuhan Anda.`;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = pageDescription;
    const openGraphTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (openGraphTitle) openGraphTitle.content = documentTitle;
    const openGraphDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (openGraphDescription) openGraphDescription.content = pageDescription;
    const noIndex = ['admin', 'account', 'orders', 'chat', 'checkout', 'not-found'].includes(page);
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = noIndex ? 'noindex, nofollow' : 'index, follow';
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = noIndex ? `${window.location.origin}/` : `${window.location.origin}${window.location.pathname}`;
  }, [language, page, selectedProduct]);

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('display_order')
      .then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    const productMatch = window.location.pathname.match(/^\/products\/([^/]+)\/?$/);
    if (page !== 'product' || !productMatch || selectedProduct) return;
    let active = true;
    setProductLoadError('');
    void supabase.from('products').select('*').eq('slug', productMatch[1]).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Unable to load product details:', error.message);
          setProductLoadError('Detail produk gagal dimuat. Silakan coba lagi.');
          return;
        }
        if (data) setSelectedProduct(data as Product);
        else setProductLoadError('Produk yang Anda cari tidak ditemukan atau tidak lagi tersedia.');
      });
    return () => { active = false; };
  }, [page, selectedProduct]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, pageParams]);

  useEffect(() => {
    const handlePopState = () => {
      setPage(getPageFromLocation());
      setPageParams(Object.fromEntries(new URLSearchParams(window.location.search)));
      setSelectedProduct(null);
      setProductLoadError('');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((newPage: string, params: Record<string, string> = {}) => {
    const routes: Record<string, Page> = {
      home: 'home',
      catalog: 'catalog',
      checkout: 'checkout',
      account: 'account',
      orders: 'orders',
      chat: 'chat',
      admin: 'admin',
      product: 'product',
      services: 'services',
      portfolio: 'portfolio',
      about: 'about',
      contact: 'contact',
      privacy: 'privacy',
      terms: 'terms',
      refund: 'refund',
    };
    setPage(routes[newPage] ?? 'not-found');
    setPageParams(params);
    setSelectedProduct(null);
    const route = newPage === 'home' ? '/' : `/${newPage}`;
    const query = new URLSearchParams(params).toString();
    window.history.pushState({}, '', query ? `${route}?${query}` : route);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addToCart(product);
      setCartOpen(true);
    },
    [addToCart, setCartOpen]
  );

  const handleProductClick = useCallback((product: Product) => {
    setProductLoadError('');
    setSelectedProduct(product);
    setPage('product');
    setPageParams({ slug: product.slug });
    window.history.pushState({}, '', `/products/${encodeURIComponent(product.slug)}`);
  }, []);

  const handleOpenProduct = useCallback(async (productId: string) => {
    const { data } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
    if (data) setSelectedProduct(data as Product);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header
        onNavigate={handleNavigate}
        currentPage={page}
        categories={categories}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            onChat={(product) => handleNavigate('chat', { product_id: product.id })}
            onProductClick={handleProductClick}
          />
        )}

        {page === 'catalog' && (
          <CatalogPage
            onAddToCart={handleAddToCart}
            onChat={(product) => handleNavigate('chat', { product_id: product.id })}
            onProductClick={handleProductClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            initialCategory={pageParams.category}
            initialFilter={pageParams.filter}
          />
        )}

        {page === 'checkout' && (
          <CheckoutPage
            onBack={() => handleNavigate('catalog')}
            onAccount={() => handleNavigate('account')}
            onComplete={() => handleNavigate('home')}
          />
        )}

        {page === 'account' && (
          <AccountPage
            onBack={() => handleNavigate('home')}
            onAdmin={() => handleNavigate('admin')}
          />
        )}

        {page === 'orders' && (
          <OrderHistoryPage
            onBack={() => handleNavigate('home')}
            onSignIn={() => handleNavigate('account')}
          />
        )}

        {page === 'chat' && (
          <ChatPage
            productId={pageParams.product_id || undefined}
            onBack={() => handleNavigate('home')}
            onSignIn={() => handleNavigate('account')}
            onProductOpen={(productId) => void handleOpenProduct(productId)}
          />
        )}

        {page === 'admin' && <AdminPage onBack={() => handleNavigate('home')} />}

        {['services', 'portfolio', 'about', 'contact', 'privacy', 'terms', 'refund', 'not-found'].includes(page) && (
          <BusinessPage
            page={page}
            service={pageParams.service}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <CartDrawer onCheckout={() => handleNavigate('checkout')} />

      {page === 'product' && !selectedProduct && (
        <div className="mx-auto w-full max-w-xl px-4 py-24 text-center text-slate-600" role="status">
          {productLoadError ? (
            <div role="alert">
              <p>{productLoadError}</p>
              <button className="mt-3 text-sm font-semibold text-cyan-800" onClick={() => handleNavigate('catalog')}>Kembali ke produk</button>
            </div>
          ) : 'Memuat detail produk...'}
        </div>
      )}

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => {
            if (page === 'product') {
              setSelectedProduct(null);
              setPage('catalog');
              setPageParams({});
              window.history.replaceState({}, '', '/catalog');
            } else {
              setSelectedProduct(null);
            }
          }}
          onNavigate={(newPage) => handleNavigate(newPage)}
          onChat={(product) => handleNavigate('chat', { product_id: product.id })}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </CartProvider>
    </LanguageProvider>
  );
}
