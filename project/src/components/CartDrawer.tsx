import { X, Plus, Minus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice, getCartItemKey } from '@/lib/utils';

type CartDrawerProps = {
  onCheckout: () => void;
};

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, isCartOpen, setCartOpen, updateQuantity, removeFromCart, totalItems, totalPrice } =
    useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-slate-900/50 transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setCartOpen(false)}
      />

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">
              Cart {totalItems > 0 && `(${totalItems})`}
            </h2>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <ShoppingCart size={36} className="text-slate-300" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Your cart is empty</h3>
            <p className="mt-1 text-sm text-slate-500">
              Browse our catalog and add some digital products to get started.
            </p>
            <button
              onClick={() => setCartOpen(false)}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={getCartItemKey(item)}
                    className="flex gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {item.product.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <h4 className="line-clamp-1 text-sm font-semibold text-slate-900">
                        {item.product.name}
                      </h4>
                      <span className="mt-0.5 text-xs text-slate-400">
                        {item.days} hari · {item.features} fitur · {item.product.file_type}
                      </span>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(getCartItemKey(item), item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(getCartItemKey(item), item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeFromCart(getCartItemKey(item))}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-600">Subtotal</span>
                <span className="text-lg font-bold text-slate-900">{formatPrice(totalPrice)}</span>
              </div>
              <p className="mb-3 text-xs text-slate-400">
                Digital products are delivered instantly after checkout.
              </p>
              <button
                onClick={onCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Proceed to Checkout
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
