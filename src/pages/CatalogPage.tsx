import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Download } from 'lucide-react';
import { supabase, type Product, type Category } from '@/lib/supabase';
import { getCategoryIcon } from '@/lib/icons';
import { ProductCard } from '@/components/ProductCard';
import { formatPrice } from '@/lib/utils';

type CatalogPageProps = {
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  initialCategory?: string;
  initialFilter?: string;
};

type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating';

export function CatalogPage({
  onAddToCart,
  onProductClick,
  searchQuery,
  setSearchQuery,
  initialCategory,
  initialFilter,
}: CatalogPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [filter, setFilter] = useState<string>(initialFilter || 'all');
  const [sort, setSort] = useState<SortOption>('popular');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('display_order').then(({ data }) => {
      setCategories(data || []);
    });
  }, []);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialFilter) setFilter(initialFilter);
  }, [initialCategory, initialFilter]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*');

    if (selectedCategory) {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) query = query.eq('category_id', cat.id);
    }

    if (filter === 'bestseller') query = query.eq('is_bestseller', true);
    else if (filter === 'new') query = query.eq('is_new', true);
    else if (filter === 'featured') query = query.eq('is_featured', true);

    if (priceRange === 'under-250000') query = query.lt('price', 250000);
    else if (priceRange === '250000-500000') query = query.gte('price', 250000).lte('price', 500000);
    else if (priceRange === '500000-1000000') query = query.gte('price', 500000).lte('price', 1000000);
    else if (priceRange === 'over-1000000') query = query.gt('price', 1000000);

    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`
      );
    }

    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      default:
        query = query.order('sales_count', { ascending: false });
    }

    const { data } = await query.limit(48);
    setProducts(data || []);
    setLoading(false);
  }, [selectedCategory, filter, priceRange, searchQuery, sort, categories]);

  useEffect(() => {
    if (categories.length > 0) fetchProducts();
  }, [fetchProducts, categories.length]);

  const filterButtons = [
    { label: 'All', value: 'all' },
    { label: 'Featured', value: 'featured' },
    { label: 'Bestsellers', value: 'bestseller' },
    { label: 'New Arrivals', value: 'new' },
  ];

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Most Popular', value: 'popular' },
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-low' },
    { label: 'Price: High to Low', value: 'price-high' },
    { label: 'Top Rated', value: 'rating' },
  ];

  const priceOptions = [
    { label: 'All Prices', value: 'all' },
    { label: `Under ${formatPrice(250000)}`, value: 'under-250000' },
    { label: `${formatPrice(250000)} - ${formatPrice(500000)}`, value: '250000-500000' },
    { label: `${formatPrice(500000)} - ${formatPrice(1000000)}`, value: '500000-1000000' },
    { label: `Over ${formatPrice(1000000)}`, value: 'over-1000000' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Product Catalog</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse our collection of premium digital products
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === btn.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {btn.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:hidden"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside
          className={`${showFilters ? 'block' : 'hidden'} w-full shrink-0 lg:block lg:w-60`}
        >
          <div className="sticky top-24 space-y-6 rounded-xl border border-slate-200 bg-white p-5">
            {/* Categories */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    !selectedCategory
                      ? 'bg-blue-50 font-semibold text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        selectedCategory === cat.slug
                          ? 'bg-blue-50 font-semibold text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={16} className="shrink-0" />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Price Range</h3>
              <div className="space-y-1">
                {priceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPriceRange(opt.value)}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
                      priceRange === opt.value
                        ? 'bg-blue-50 font-semibold text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {(selectedCategory || filter !== 'all' || priceRange !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setFilter('all');
                  setPriceRange('all');
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <X size={14} />
                Clear Filters
              </button>
            )}
          </div>
        </aside>

        {/* Products grid */}
        <div className="min-w-0 flex-1">
          {searchQuery && (
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
              <Search size={16} />
              Showing results for "<span className="font-semibold">{searchQuery}</span>"
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 aspect-[4/3] rounded-xl bg-slate-100" />
                  <div className="mb-2 h-4 rounded bg-slate-100" />
                  <div className="mb-3 h-3 rounded bg-slate-100" />
                  <div className="h-6 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Download size={32} className="text-slate-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No products found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onClick={onProductClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
