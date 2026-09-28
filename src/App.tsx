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
import { OrderHistoryPage } from '@/pages/OrderHistoryPage';
import { ChatPage } from '@/pages/ChatPage';
import { AdminPage } from '@/pages/AdminPage';

type Page = 'home' | 'catalog' | 'checkout' | 'account' | 'orders' | 'chat' | 'admin';

function getPageFromLocation(): Page {
  if (new URLSearchParams(window.location.search).has('order_id')) return 'checkout';
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/catalog') return 'catalog';
  if (path === '/checkout') return 'checkout';
  if (path === '/account') return 'account';
  if (path === '/orders') return 'orders';
  if (path === '/chat') return 'chat';
  if (path === '/admin') return 'admin';
  return 'home';
}

function AppContent() {
  const [page, setPage] = useState<Page>(getPageFromLocation);
  const [pageParams, setPageParams] = useState<Record<string, string>>(() => ({
    product_id: new URLSearchParams(window.location.search).get('product_id') ?? '',
  }));
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
      setPageParams({
        product_id: new URLSearchParams(window.location.search).get('product_id') ?? '',
      });
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
    setSelectedProduct(product);
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
      </main>

      <Footer onNavigate={handleNavigate} />

      <CartDrawer onCheckout={() => handleNavigate('checkout')} />

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onNavigate={(newPage) => handleNavigate(newPage)}
          onChat={(product) => handleNavigate('chat', { product_id: product.id })}
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
