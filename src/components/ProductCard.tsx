import { ShoppingCart, Download, Eye, MessageCircle } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import { formatPrice, calculateDiscount, formatNumber } from '@/lib/utils';
import { StarRating } from './StarRating';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedProduct } from '@/lib/productLocalization';
import { trackEvent } from '@/lib/business';

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
  onChat: (product: Product) => void;
  onClick: (product: Product) => void;
};

export function ProductCard({ product, onAddToCart, onChat, onClick }: ProductCardProps) {
  const { language, t } = useLanguage();
  const localizedProduct = getLocalizedProduct(product, language);
  const discount = calculateDiscount(product.price, product.original_price);
  const outOfStock = product.stock <= 0;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60 cursor-pointer"
      onClick={() => onClick(product)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={localizedProduct.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Download size={48} />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.is_new && (
            <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
              {t('New')}
            </span>
          )}
          {product.is_bestseller && (
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
              {t('Bestseller')}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
              -{discount}%
            </span>
          )}
          {outOfStock && (
            <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
              {t('Out of stock')}
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
          {product.file_type}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-gradient-to-t from-slate-900/70 to-transparent p-3 transition-transform duration-300 group-hover:translate-y-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(product);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white"
          >
            <Eye size={14} /> {t('Details')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              trackEvent('click_buy', { product_id: product.slug });
              onAddToCart(product);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            disabled={outOfStock}
            title={outOfStock ? t('Out of stock') : t('Add to cart')}
          >
            <ShoppingCart size={14} /> {outOfStock ? t('Unavailable') : t('Add')}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center gap-2">
          <StarRating rating={product.rating} size={12} />
          <span className="text-xs text-slate-500">
            {product.rating.toFixed(1)} ({formatNumber(product.review_count)})
          </span>
        </div>

        <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {localizedProduct.name}
        </h3>

        <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
          {localizedProduct.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {formatPrice(product.price)}
            </span>
            {product.original_price && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">
            {formatNumber(product.sales_count)} {t('sales')}
          </span>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onChat(product);
            }}
            title={`${t('Chat admin tentang')} ${localizedProduct.name}`}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
          >
            <MessageCircle size={14} /> Chat
          </button>
        </div>
      </div>
    </div>
  );
}
