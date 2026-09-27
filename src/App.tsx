import { useState, useEffect, useCallback } from 'react';
import { CartProvider, useCart } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { supabase, type Product, type Category } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { ProductDetail } from '@/pages/ProductDetail';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { AccountPage } from '@/pages/AccountPage';
import { AdminPage } from '@/pages/AdminPage';

type Page = 'home' | 'catalog' | 'checkout' | 'account' | 'admin';

function getPageFromLocation(): Page {
  if (new URLSearchParams(window.location.search).has('order_id')) return 'checkout';
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/catalog') return 'catalog';
  if (path === '/checkout') return 'checkout';
  if (path === '/account') return 'account';
  if (path === '/admin') return 'admin';
  return 'home';
}

function AppContent() {
  const [page, setPage] = useState<Page>(getPageFromLocation);
  const [pageParams, setPageParams] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addToCart, setCartOpen } = useCart();

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('display_order')
      .then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, pageParams]);

  useEffect(() => {
    const handlePopState = () => {
      setPage(getPageFromLocation());
      setPageParams({});
      setSelectedProduct(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((newPage: string, params: Record<string, string> = {}) => {
    setPage(newPage as Page);
    setPageParams(params);
    setSelectedProduct(null);
    const route = newPage === 'home' ? '/' : `/${newPage}`;
    window.history.pushState({}, '', route);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addToCart(product);
      setCartOpen(true);
    },
    [addToCart, setCartOpen]
  );

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
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
            onProductClick={handleProductClick}
          />
        )}

        {page === 'catalog' && (
          <CatalogPage
            onAddToCart={handleAddToCart}
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

        {page === 'account' && <AccountPage onBack={() => handleNavigate('home')} />}

        {page === 'admin' && <AdminPage onBack={() => handleNavigate('home')} />}
      </main>

      <Footer onNavigate={handleNavigate} />

      <CartDrawer onCheckout={() => handleNavigate('checkout')} />

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onNavigate={(newPage) => handleNavigate(newPage)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </CartProvider>
  );
}
