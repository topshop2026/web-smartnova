import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product, CartItem, ProductConfiguration } from '@/lib/supabase';
import { getCartItemKey, getProductPrice, getDefaultDurationDays } from '@/lib/utils';

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product, configuration?: ProductConfiguration) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartnova-cart');
      if (saved) {
        const storedItems = JSON.parse(saved) as Partial<CartItem>[];
        setItems(storedItems.map((item) => {
          const product = item.product as Product;
          const days = item.days ?? getDefaultDurationDays(product.duration_prices ?? []);
          const features = item.features ?? 1;
          return {
            product,
            quantity: item.quantity ?? 1,
            days,
            features,
            unitPrice: item.unitPrice ?? getProductPrice(product, days, features),
          };
        }));
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem('smartnova-cart', JSON.stringify(items));
  }, [items, hydrated]);

  const addToCart = useCallback((product: Product, configuration?: ProductConfiguration) => {
    const days = configuration?.days ?? getDefaultDurationDays(product.duration_prices);
    const features = configuration?.features ?? 1;
    const unitPrice = getProductPrice(product, days, features);
    const newItem = { product, days, features, unitPrice, quantity: 1 };
    setItems((prev) => {
      const key = getCartItemKey(newItem);
      const existing = prev.find((item) => getCartItemKey(item) === key);
      if (existing) {
        return prev.map((i) =>
          getCartItemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, newItem];
    });
  }, []);

  const removeFromCart = useCallback((itemKey: string) => {
    setItems((prev) => prev.filter((item) => getCartItemKey(item) !== itemKey));
  }, []);

  const updateQuantity = useCallback((itemKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => getCartItemKey(item) !== itemKey));
      return;
    }
    setItems((prev) =>
      prev.map((item) => getCartItemKey(item) === itemKey ? { ...item, quantity } : item)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
