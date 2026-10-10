import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PackagePlus,
  Plus,
  Quote,
  Save,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Category, type EditorialTestimonial, type Order, type Product } from '@/lib/supabase';
import { CategoryIcon } from '@/components/CategoryIcon';
import { getOrderStatus, orderStatuses } from '@/lib/orderStatus';
import { formatPrice } from '@/lib/utils';
import { getProductImages, parseProductImageUrls, validateProductImageUrls } from '@/lib/productImages';
import { AdminRevenueOverview } from '@/components/AdminRevenueOverview';
import { AdminBusinessPanel } from '@/components/AdminBusinessPanel';

type AdminPageProps = {
  onBack: () => void;
};

type AdminSection = 'overview' | 'portfolio' | 'leads' | 'categories' | 'products' | 'orders' | 'testimonials';

const adminSections: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Dashboard overview', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio projects', icon: BriefcaseBusiness },
  { id: 'leads', label: 'Service inquiries', icon: MessageSquareText },
  { id: 'categories', label: 'Category management', icon: Tags },
  { id: 'products', label: 'Product management', icon: PackagePlus },
  { id: 'orders', label: 'Orders / transactions', icon: ClipboardList },
  { id: 'testimonials', label: 'Editorial testimonials', icon: Quote },
];

function getAdminSection(): AdminSection {
  const section = new URLSearchParams(window.location.search).get('section');
  return adminSections.some((item) => item.id === section) ? section as AdminSection : 'overview';
}

export function AdminPage({ onBack }: AdminPageProps) {
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const [activeSection, setActiveSection] = useState<AdminSection>(getAdminSection);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productOriginal, setProductOriginal] = useState<Product | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryOriginal, setCategoryOriginal] = useState<Category | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [testimonials, setTestimonials] = useState<EditorialTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [categoriesError, setCategoriesError] = useState('');
  const [testimonialsError, setTestimonialsError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState('');
  const [addingTestimonial, setAddingTestimonial] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [deletingTestimonialId, setDeletingTestimonialId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({ product_id: '', author_name: '', quote: '' });
  const [message, setMessage] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '', icon: 'Package' });
  const [newProduct, setNewProduct] = useState({
    name: '',
    name_en: '',
    slug: '',
    description: '',
    description_en: '',
    category_id: '',
    price: 0,
    feature_price: 10000,
    stock: 100,
    image_url: '',
    image_urls: '',
    file_type: 'ZIP',
    file_size: '1 MB',
    tags: '',
  });

  const navigateSection = (section: AdminSection) => {
    setActiveSection(section);
    const query = new URLSearchParams(window.location.search);
    query.set('section', section);
    window.history.pushState({}, '', `${window.location.pathname}?${query.toString()}`);
  };

  useEffect(() => {
    const handlePopState = () => setActiveSection(getAdminSection());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (user?.app_metadata.role !== 'admin') {
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      const [productResult, categoryResult] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('categories').select('*').order('display_order'),
      ]);
      const [orderResult, testimonialResult] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('editorial_testimonials').select('*').order('created_at', { ascending: false }),
      ]);
      setProductsError(productResult.error?.message ?? '');
      setCategoriesError(categoryResult.error?.message ?? '');
      setTestimonialsError(testimonialResult.error?.message ?? '');
      if (orderResult.error) {
        setOrdersError(orderResult.error.message);
      } else {
        setOrdersError('');
      }
      setProducts((productResult.data as Product[] | null) ?? []);
      setCategories((categoryResult.data as Category[] | null) ?? []);
      setOrders((orderResult.data as Order[] | null) ?? []);
      setTestimonials((testimonialResult.data as EditorialTestimonial[] | null) ?? []);
      setLoading(false);
    };
    void loadDashboard();
  }, [user?.app_metadata.role, userId]);

  const updateOrderStatus = async (order: Order, fulfillmentStatus: string) => {
    setSavingOrderId(order.id);
    setMessage('');
    const { error } = await supabase.rpc('update_order_fulfillment_status', {
      p_order_id: order.id,
      p_next_status: fulfillmentStatus,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setOrders((current) => current.map((item) => item.id === order.id
        ? { ...item, fulfillment_status: fulfillmentStatus }
        : item
      ));
      setMessage(`Order ${order.order_number} status updated.`);
    }
    setSavingOrderId(null);
  };

  const createEditorialTestimonial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const authorName = testimonialForm.author_name.trim();
    const quote = testimonialForm.quote.trim();
    if (!testimonialForm.product_id || !authorName || !quote) {
      setMessage('Select a product and enter the editorial attribution and testimonial.');
      return;
    }

    setAddingTestimonial(true);
    setMessage('');
    const { data, error } = await supabase
      .from('editorial_testimonials')
      .insert({
        product_id: testimonialForm.product_id,
        author_name: authorName,
        quote,
      })
      .select('*')
      .single();
    if (error) {
      setMessage(error.message);
    } else {
      setTestimonials((current) => [data as EditorialTestimonial, ...current]);
      setTestimonialForm({ product_id: '', author_name: '', quote: '' });
      setShowTestimonialForm(false);
      setMessage('Editorial testimonial added.');
    }
    setAddingTestimonial(false);
  };

  const deleteEditorialTestimonial = async (testimonial: EditorialTestimonial) => {
    if (!window.confirm('Delete this editorial testimonial?')) return;
    setDeletingTestimonialId(testimonial.id);
    setMessage('');
    const { error } = await supabase
      .from('editorial_testimonials')
      .delete()
      .eq('id', testimonial.id);
    if (error) {
      setMessage(error.message);
    } else {
      setTestimonials((current) => current.filter((item) => item.id !== testimonial.id));
      setMessage('Editorial testimonial deleted.');
    }
    setDeletingTestimonialId(null);
  };

  const updateProduct = (productId: string, changes: Partial<Product>) => {
    setProducts((current) => current.map((product) =>
      product.id === productId ? { ...product, ...changes } : product
    ));
  };

  const beginEditProduct = (product: Product) => {
    setProductOriginal(product);
    setEditingProductId(product.id);
  };

  const cancelEditProduct = () => {
    if (productOriginal) {
      setProducts((current) => current.map((item) => item.id === productOriginal.id ? productOriginal : item));
    }
    setProductOriginal(null);
    setEditingProductId(null);
  };

  const saveProduct = async (product: Product) => {
    const imageUrls = parseProductImageUrls((product.image_urls ?? []).join('\n'));
    if (!validateProductImageUrls([...imageUrls, product.image_url?.trim() ?? ''].filter(Boolean))) {
      setMessage(`Images for "${product.name}" must use valid public HTTP or HTTPS URLs.`);
      return;
    }

    setSavingId(product.id);
    setMessage('');
    const { error } = await supabase.from('products').update({
      name: product.name.trim(),
      name_en: product.name_en?.trim() || null,
      description: product.description.trim(),
      description_en: product.description_en?.trim() || null,
      image_url: product.image_url?.trim() || null,
      image_urls: imageUrls,
      category_id: product.category_id || null,
      file_type: product.file_type?.trim() || null,
      tags: (product.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
      price: product.price,
      feature_price: product.feature_price,
      duration_prices: product.duration_prices,
      stock: product.stock,
    }).eq('id', product.id);

    setMessage(error ? error.message : `${product.name} saved.`);
    if (!error) {
      setEditingProductId(null);
      setProductOriginal(null);
    }
    setSavingId(null);
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}" from the catalog? This cannot be undone.`)) return;
    setDeletingId(product.id);
    setMessage('');
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      setMessage(error.message);
    } else {
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setEditingProductId(null);
      setProductOriginal(null);
      setMessage(`${product.name} deleted from the catalog.`);
    }
    setDeletingId(null);
  };

  const updateCategory = (categoryId: string, changes: Partial<Category>) => {
    setCategories((current) => current.map((category) =>
      category.id === categoryId ? { ...category, ...changes } : category
    ));
  };

  const beginEditCategory = (category: Category) => {
    setCategoryOriginal(category);
    setEditingCategoryId(category.id);
  };

  const cancelEditCategory = () => {
    if (categoryOriginal) {
      setCategories((current) => current.map((item) => item.id === categoryOriginal.id ? categoryOriginal : item));
    }
    setCategoryOriginal(null);
    setEditingCategoryId(null);
  };

  const saveCategory = async (category: Category) => {
    setSavingCategoryId(category.id);
    setMessage('');
    const { error } = await supabase.from('categories').update({
      name: category.name.trim(),
      slug: category.slug.trim(),
      description: category.description?.trim() || null,
      icon: category.icon.trim() || 'Package',
    }).eq('id', category.id);
    setMessage(error ? error.message : `${category.name} category saved.`);
    if (!error) {
      setEditingCategoryId(null);
      setCategoryOriginal(null);
    }
    setSavingCategoryId(null);
  };

  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"? Products in it will remain uncategorized.`)) return;
    setDeletingCategoryId(category.id);
    setMessage('');
    const { error } = await supabase.from('categories').delete().eq('id', category.id);
    if (error) {
      setMessage(error.message);
    } else {
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setEditingCategoryId(null);
      setCategoryOriginal(null);
      setMessage(`${category.name} category deleted.`);
    }
    setDeletingCategoryId(null);
  };

  const createCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddingCategory(true);
    setMessage('');
    const name = newCategory.name.trim();
    const slug = newCategory.slug.trim() || name.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const { data, error } = await supabase.from('categories').insert({
      name,
      slug,
      description: newCategory.description.trim() || null,
      icon: newCategory.icon.trim() || 'Package',
      display_order: categories.length + 1,
    }).select('*').single();
    if (error) {
      setMessage(error.message);
    } else if (data) {
      setCategories((current) => [...current, data as Category].sort((left, right) => left.display_order - right.display_order));
      setNewCategory({ name: '', slug: '', description: '', icon: 'Package' });
      setShowCategoryForm(false);
      setMessage(`${name} category added.`);
    }
    setAddingCategory(false);
  };

  const createProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const imageUrls = parseProductImageUrls(newProduct.image_urls);
    if (!validateProductImageUrls([...imageUrls, newProduct.image_url.trim()].filter(Boolean))) {
      setMessage('Product images must use valid public HTTP or HTTPS URLs.');
      return;
    }
    setAddingProduct(true);
    const name = newProduct.name.trim();
    const slug = newProduct.slug.trim() || name.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const basePrice = Number(newProduct.price);
    const duration_prices = [
      { days: 1, surcharge: Math.round(basePrice * 0.5 / 1000) * 1000 },
      { days: 2, surcharge: Math.round(basePrice * 0.25 / 1000) * 1000 },
      { days: 3, surcharge: Math.round(basePrice * 0.1 / 1000) * 1000 },
      { days: 7, surcharge: 0 },
      { days: 14, surcharge: 0 },
    ];
    const { data, error } = await supabase.from('products').insert({
      name,
      name_en: newProduct.name_en.trim() || null,
      slug,
      description: newProduct.description.trim(),
      description_en: newProduct.description_en.trim() || null,
      category_id: newProduct.category_id || null,
      price: basePrice,
      original_price: null,
      feature_price: Number(newProduct.feature_price),
      duration_prices,
      stock: Number(newProduct.stock),
      image_url: newProduct.image_url.trim() || null,
      image_urls: imageUrls,
      preview_url: null,
      file_type: newProduct.file_type.trim() || null,
      file_size: newProduct.file_size.trim() || null,
      tags: newProduct.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      rating: 0,
      review_count: 0,
      sales_count: 0,
      is_featured: false,
      is_bestseller: false,
      is_new: true,
    }).select('*').single();

    if (error) {
      setMessage(error.message);
    } else if (data) {
      setProducts((current) => [...current, data as Product].sort((left, right) => left.name.localeCompare(right.name)));
      setNewProduct({
        name: '', name_en: '', slug: '', description: '', description_en: '', category_id: '', price: 0,
        feature_price: 10000, stock: 100, image_url: '', image_urls: '', file_type: 'ZIP', file_size: '1 MB', tags: '',
      });
      setShowAddForm(false);
      setMessage(`${name} added to the catalog.`);
    }
    setAddingProduct(false);
  };

  const lowStockCount = products.filter((product) => product.stock <= 5).length;
  const totalStock = products.reduce((total, product) => total + product.stock, 0);
  const editingCategory = categories.find((category) => category.id === editingCategoryId) ?? null;
  const visibleProducts = products.filter((product) =>
    `${product.name} ${product.name_en ?? ''}`.toLowerCase().includes(productSearch.toLowerCase())
  );
  const visibleCategories = categories.filter((category) =>
    `${category.name} ${category.slug}`.toLowerCase().includes(categorySearch.toLowerCase())
  );

  if (user?.app_metadata.role !== 'admin') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Administrator access required</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in with an account assigned the admin role.</p>
        <button onClick={onBack} className="mt-5 text-sm font-medium text-blue-700">Back to store</button>
      </div>
    );
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-slate-500" role="status">Loading admin workspace...</div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Back to store
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="self-start rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-24" aria-label="Admin navigation">
          <div className="px-3 pb-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin workspace</p>
          </div>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:flex lg:flex-col" aria-label="Admin sections">
            {adminSections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigateSection(id)}
                aria-current={activeSection === id ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition sm:gap-3 sm:text-sm lg:w-full ${
                  activeSection === id
                    ? 'bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">SmartNova admin</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {adminSections.find((item) => item.id === activeSection)?.label}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {activeSection === 'overview' ? 'Ringkasan performa dan aktivitas toko.' : 'Kelola data dan aktivitas pada bagian ini.'}
              </p>
            </div>
            {activeSection === 'products' && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                <Plus size={16} /> Add product
              </button>
            )}
            {activeSection === 'categories' && (
              <button
                type="button"
                onClick={() => setShowCategoryForm(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                <Plus size={16} /> Add category
              </button>
            )}
            {activeSection === 'testimonials' && (
              <button
                type="button"
                onClick={() => setShowTestimonialForm(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                <Plus size={16} /> Add testimonial
              </button>
            )}
          </div>
          {message && <p role="status" className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}

          {activeSection === 'overview' && <>
      {ordersError ? (
        <p role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Revenue overview is unavailable because orders could not be loaded: {ordersError}
        </p>
      ) : (
        <AdminRevenueOverview orders={orders} />
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-medium text-slate-500">Catalog products</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{products.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-medium text-slate-500">Available stock</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{totalStock}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-medium text-slate-500">Low stock (5 or fewer)</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{lowStockCount}</p>
        </div>
      </div>
          </>}
          {activeSection === 'portfolio' && <AdminBusinessPanel section="portfolio" />}
          {activeSection === 'leads' && <AdminBusinessPanel section="leads" />}
          {activeSection === 'testimonials' && <>
      <section className="mb-7 rounded-xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm">
        {testimonialsError && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Editorial testimonials could not be loaded: {testimonialsError}</p>}
        <div className="mb-4">
          <h2 className="text-base font-semibold text-amber-950">Editorial testimonials</h2>
          <p className="mt-1 text-sm text-amber-800">
            These promotional statements are shown separately from verified customer reviews and are labeled “Editorial testimonial.”
          </p>
        </div>
        {showTestimonialForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
        <form onSubmit={createEditorialTestimonial} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl md:grid md:grid-cols-2">
          <div className="mb-2 flex items-center justify-between md:col-span-2">
            <h3 className="font-semibold text-slate-900">Add editorial testimonial</h3>
            <button type="button" onClick={() => setShowTestimonialForm(false)} aria-label="Close form" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
          </div>
          <label className="text-xs font-medium text-slate-600">
            Product
            <select
              required
              value={testimonialForm.product_id}
              onChange={(event) => setTestimonialForm({ ...testimonialForm, product_id: event.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Choose a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Editorial attribution
            <input
              required
              maxLength={120}
              value={testimonialForm.author_name}
              onChange={(event) => setTestimonialForm({ ...testimonialForm, author_name: event.target.value })}
              placeholder="SmartNova Editorial Team"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-600 md:col-span-2">
            Promotional statement
            <textarea
              required
              maxLength={1000}
              rows={3}
              value={testimonialForm.quote}
              onChange={(event) => setTestimonialForm({ ...testimonialForm, quote: event.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="md:col-span-2">
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowTestimonialForm(false)} className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
              <button type="submit" disabled={addingTestimonial} className="flex items-center gap-2 rounded-md bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50">
                <Plus size={16} /> {addingTestimonial ? 'Adding...' : 'Add editorial testimonial'}
              </button>
            </div>
          </div>
        </form>
        </div>
        )}
        <div className="mt-4 space-y-2">
          {testimonials.map((testimonial) => {
            const testimonialProduct = products.find((product) => product.id === testimonial.product_id);
            return (
              <article key={testimonial.id} className="flex items-start justify-between gap-4 rounded-lg border border-amber-100 bg-white p-3">
                <div>
                  <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                    Editorial testimonial
                  </span>
                  <p className="mt-2 text-sm text-slate-700">“{testimonial.quote}”</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {testimonial.author_name} · {testimonialProduct?.name ?? 'Product'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteEditorialTestimonial(testimonial)}
                  disabled={deletingTestimonialId === testimonial.id}
                  aria-label={`Delete editorial testimonial by ${testimonial.author_name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </section>
          </>}
          {activeSection === 'orders' && <section className="mb-7 rounded-xl border border-cyan-100 bg-white p-5 shadow-sm">
        {ordersError && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Orders could not be loaded: {ordersError}</p>}
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-900">
          <PackagePlus size={17} /> Status Order
        </div>
        <p className="mt-1 text-xs text-cyan-700">Update the fulfillment stage customers see in their account.</p>
        <div className="mt-5 space-y-3">
          {orders.length === 0 ? (
            <p className="rounded-lg border border-cyan-100 bg-white p-4 text-sm text-slate-500">Belum ada order.</p>
          ) : orders.map((order) => {
            const currentStatus = getOrderStatus(order.fulfillment_status);
            return (
              <div key={order.id} className="rounded-lg border border-cyan-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.order_number}</p>
                    <p className="mt-1 text-xs text-slate-500">{order.customer_name} · {order.customer_email}</p>
                  </div>
                  <select
                    value={currentStatus.value}
                    onChange={(event) => void updateOrderStatus(order, event.target.value)}
                    disabled={savingOrderId === order.id}
                    className={`rounded-lg border-0 px-3 py-2 text-sm font-semibold ${currentStatus.color}`}
                  >
                    {orderStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-1">
                  {orderStatuses.map((status) => (
                    <div key={status.value} className={`h-1.5 rounded-full ${status.value === currentStatus.value || orderStatuses.findIndex((item) => item.value === status.value) < orderStatuses.findIndex((item) => item.value === currentStatus.value) ? 'bg-cyan-600' : 'bg-slate-200'}`} />
                  ))}
                </div>
                <ul className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                  {(order.items_json ?? []).map((item, index) => {
                    const quantity = item.quantity ?? 1;
                    const unitPrice = item.unit_price ?? item.unitPrice ?? 0;
                    const productName = item.product_name ?? item.product?.name ?? 'Produk';
                    return (
                      <li key={`${item.product_id ?? productName}-${index}`} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-sm">
                        <div>
                          <p className="font-medium text-slate-800">{productName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.days ? `${item.days} hari` : 'Durasi standar'}
                            {item.features ? ` · ${item.features} fitur` : ''}
                            {` · Qty ${quantity}`}
                          </p>
                        </div>
                        <span className="text-slate-600">{formatPrice(unitPrice * quantity)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>}
          {activeSection === 'categories' && <section className="mb-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {categoriesError && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Categories could not be loaded: {categoriesError}</p>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">Add, edit, or remove categories used by your products.</p>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search categories</span>
            <input value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder="Search categories..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </label>
        </div>
        {showCategoryForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={createCategory} className="grid max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:grid-cols-2">
            <div className="flex items-center justify-between sm:col-span-2">
              <h3 className="font-semibold text-slate-900">Add category</h3>
              <button type="button" onClick={() => setShowCategoryForm(false)} aria-label="Close form" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <label className="text-xs font-medium text-slate-600">
              Category name
              <input required value={newCategory.name} onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Slug
              <input value={newCategory.slug} onChange={(event) => setNewCategory({ ...newCategory, slug: event.target.value })} placeholder="generated-from-name" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Icon name or image URL
              <input value={newCategory.icon} onChange={(event) => setNewCategory({ ...newCategory, icon: event.target.value })} placeholder="Package or https://..." className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Description
              <input value={newCategory.description} onChange={(event) => setNewCategory({ ...newCategory, description: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setShowCategoryForm(false)} className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
              <button type="submit" disabled={addingCategory} className="flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
                <Plus size={16} /> {addingCategory ? 'Adding...' : 'Create category'}
              </button>
            </div>
          </form>
          </div>
        )}
        {visibleCategories.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleCategories.map((category) => (
              <article key={category.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryIcon value={category.icon} size={24} alt={`${category.name} icon`} className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-2 object-contain" onLoadError={() => setMessage('Category icon could not be loaded. Check the public image URL.')} />
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{category.name}</h3>
                    <p className="truncate text-xs text-slate-500">/{category.slug} · {products.filter((product) => product.category_id === category.id).length} products</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => beginEditCategory(category)} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                  <button type="button" onClick={() => void deleteCategory(category)} disabled={deletingCategoryId === category.id} aria-label={`Delete ${category.name}`} className="rounded-md border border-rose-200 p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">{categoriesError ? 'Categories are unavailable until the load issue is resolved.' : categories.length ? 'No categories match your search.' : 'No categories yet. Add your first category.'}</p>}
        {editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <form onSubmit={(event) => { event.preventDefault(); void saveCategory(editingCategory); }} className="grid max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:grid-cols-2">
              <div className="flex items-center justify-between sm:col-span-2">
                <h3 className="font-semibold text-slate-900">Edit category</h3>
                <button type="button" onClick={cancelEditCategory} aria-label="Close form" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
              </div>
              <label className="text-xs font-medium text-slate-600">Name<input required value={editingCategory.name} onChange={(event) => updateCategory(editingCategory.id, { name: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs font-medium text-slate-600">Slug<input required value={editingCategory.slug} onChange={(event) => updateCategory(editingCategory.id, { slug: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs font-medium text-slate-600 sm:col-span-2">Description<input value={editingCategory.description ?? ''} onChange={(event) => updateCategory(editingCategory.id, { description: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs font-medium text-slate-600 sm:col-span-2">Icon name or public image URL<input value={editingCategory.icon} onChange={(event) => updateCategory(editingCategory.id, { icon: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
              <div className="flex items-center gap-3 sm:col-span-2">
                <CategoryIcon value={editingCategory.icon} size={24} alt="Category icon preview" className="h-12 w-12 rounded-lg border border-slate-200 bg-slate-50 p-2 object-contain" onLoadError={() => setMessage('Category icon could not be loaded. Check that the image URL is public and points directly to an image.')} />
                <p className="text-xs text-slate-500">Use a public direct image URL. Google Drive sharing links are converted automatically.</p>
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={cancelEditCategory} className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
                <button type="submit" disabled={savingCategoryId === editingCategory.id} className="flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} />{savingCategoryId === editingCategory.id ? 'Saving...' : 'Save category'}</button>
              </div>
            </form>
          </div>
        )}
      </section>}
          {activeSection === 'products' && <>
      {productsError && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Products could not be loaded: {productsError}</p>}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
        <form onSubmit={createProduct} className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
          <h2 className="mb-4 text-base font-semibold text-slate-900">New product</h2>
          <button type="button" onClick={() => setShowAddForm(false)} aria-label="Close form" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-slate-600">
              Product name (Indonesian)
              <input required value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Product name (English)
              <input value={newProduct.name_en} onChange={(event) => setNewProduct({ ...newProduct, name_en: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Slug
              <input value={newProduct.slug} onChange={(event) => setNewProduct({ ...newProduct, slug: event.target.value })} placeholder="generated-from-name" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Category
              <select value={newProduct.category_id} onChange={(event) => setNewProduct({ ...newProduct, category_id: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">No category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Base price (IDR)
              <input required type="number" min="1" step="1000" value={newProduct.price} onChange={(event) => setNewProduct({ ...newProduct, price: Number(event.target.value) })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Stock
              <input required type="number" min="0" step="1" value={newProduct.stock} onChange={(event) => setNewProduct({ ...newProduct, stock: Number(event.target.value) })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Price per feature (IDR)
              <input required type="number" min="0" step="1000" value={newProduct.feature_price} onChange={(event) => setNewProduct({ ...newProduct, feature_price: Number(event.target.value) })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              File type
              <input value={newProduct.file_type} onChange={(event) => setNewProduct({ ...newProduct, file_type: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              File size
              <input value={newProduct.file_size} onChange={(event) => setNewProduct({ ...newProduct, file_size: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600 sm:col-span-2 lg:col-span-4">
              Description (Indonesian)
              <textarea required rows={3} value={newProduct.description} onChange={(event) => setNewProduct({ ...newProduct, description: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600 sm:col-span-2 lg:col-span-4">
              Description (English, optional)
              <textarea rows={3} value={newProduct.description_en} onChange={(event) => setNewProduct({ ...newProduct, description_en: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600 sm:col-span-2">
              Main image URL
              <input type="url" value={newProduct.image_url} onChange={(event) => setNewProduct({ ...newProduct, image_url: event.target.value })} placeholder="https://example.com/image.jpg" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600 sm:col-span-2">
              Additional image URLs (one URL per line)
              <textarea rows={3} value={newProduct.image_urls} onChange={(event) => setNewProduct({ ...newProduct, image_urls: event.target.value })} placeholder={'https://example.com/image-2.jpg\nhttps://example.com/image-3.jpg'} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600 sm:col-span-2">
              Tags (comma separated)
              <input value={newProduct.tags} onChange={(event) => setNewProduct({ ...newProduct, tags: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={addingProduct} className="flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              <Plus size={16} /> {addingProduct ? 'Adding...' : 'Create product'}
            </button>
          </div>
        </form>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading products...</p>
      ) : (
        <div>
          <label className="mb-4 block max-w-sm">
            <span className="sr-only">Search products</span>
            <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          </label>
          {visibleProducts.length ? <div className="space-y-3">
          {visibleProducts.map((product) => (
            <div key={product.id}>
              <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  {product.image_url && <img src={product.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover" />}
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">{product.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">{formatPrice(product.price)} · Stock {product.stock}{product.category_id ? ` · ${categories.find((category) => category.id === product.category_id)?.name ?? ''}` : ''}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => beginEditProduct(product)} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                  <button type="button" onClick={() => void deleteProduct(product)} disabled={deletingId === product.id} aria-label={`Delete ${product.name}`} className="rounded-md border border-rose-200 p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={15} /></button>
                </div>
              </article>
              {editingProductId === product.id && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <form
              onSubmit={(event) => { event.preventDefault(); void saveProduct(product); }}
              className="max-h-[92vh] w-full max-w-5xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Edit product</h2>
                <button type="button" onClick={cancelEditProduct} aria-label="Close form" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_150px_150px_125px_2fr_auto] lg:items-end">
              <div className="min-w-0">
                <label className="text-xs font-medium text-slate-600">
                  Product name (Indonesian)
                  <input
                    required
                    value={product.name}
                    onChange={(event) => updateProduct(product.id, { name: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm font-semibold text-slate-900"
                  />
                </label>
                <p className="mt-1 text-xs text-slate-500">Base: {formatPrice(product.price)}</p>
              </div>
              <label className="text-xs font-medium text-slate-600">
                Base price
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={product.price}
                  onChange={(event) => updateProduct(product.id, { price: Number(event.target.value) })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Price per feature
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={product.feature_price}
                  onChange={(event) => updateProduct(product.id, { feature_price: Number(event.target.value) })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Available stock
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={product.stock}
                  onChange={(event) => updateProduct(product.id, { stock: Number(event.target.value) })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Category
                <select
                  value={product.category_id ?? ''}
                  onChange={(event) => updateProduct(product.id, {
                    category_id: event.target.value || null,
                  })}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-slate-600">Rush surcharge by delivery time</legend>
                <div className="grid grid-cols-5 gap-2">
                  {product.duration_prices.map((option, index) => (
                    <label key={option.days} className="text-[11px] text-slate-500">
                      {option.days} day{option.days === 1 ? '' : 's'}
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={option.surcharge}
                        onChange={(event) => {
                          const duration_prices = [...product.duration_prices];
                          duration_prices[index] = { ...option, surcharge: Number(event.target.value) };
                          updateProduct(product.id, { duration_prices });
                        }}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-2 text-xs text-slate-900"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex gap-2 lg:flex-col">
                <button
                  type="submit"
                  disabled={savingId === product.id || deletingId === product.id}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingId === product.id ? <CheckCircle2 size={17} /> : <Save size={17} />}
                  <span>Save</span>
                </button>
                <button type="button" onClick={cancelEditProduct} className="flex h-10 flex-1 items-center justify-center rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
              </div>
              <div className="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                <label className="text-xs font-medium text-slate-600">
                  Product name (English)
                  <input
                    value={product.name_en ?? ''}
                    onChange={(event) => updateProduct(product.id, { name_en: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  File type
                  <input
                    value={product.file_type ?? ''}
                    onChange={(event) => updateProduct(product.id, { file_type: event.target.value })}
                    placeholder="ZIP, PDF, FIG..."
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  Tags (comma separated)
                  <input
                    value={(product.tags ?? []).join(', ')}
                    onChange={(event) => updateProduct(product.id, {
                      tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
                    })}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  Description (Indonesian)
                  <textarea
                    rows={3}
                    value={product.description}
                    onChange={(event) => updateProduct(product.id, { description: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  Description (English)
                  <textarea
                    rows={3}
                    value={product.description_en ?? ''}
                    onChange={(event) => updateProduct(product.id, { description_en: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  Main image URL
                  <input
                    type="url"
                    value={product.image_url ?? ''}
                    onChange={(event) => updateProduct(product.id, { image_url: event.target.value || null })}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  Additional image URLs (one URL per line)
                  <textarea
                    rows={3}
                    value={(product.image_urls ?? []).join('\n')}
                    onChange={(event) => {
                      const image_urls = event.target.value.split(/\r?\n/);
                      updateProduct(product.id, { image_urls });
                    }}
                    placeholder={'https://example.com/image-2.jpg\nhttps://example.com/image-3.jpg'}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
                  />
                </label>
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  {getProductImages(product.image_url, product.image_urls).map((imageUrl) => (
                    <img
                      key={imageUrl}
                      src={imageUrl}
                      alt={`${product.name} preview`}
                      className="h-16 w-16 rounded-lg border border-slate-200 bg-slate-50 object-cover"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden';
                      }}
                    />
                  ))}
                </div>
              </div>
            </form>
            </div>}
            </div>
          ))}
          </div> : <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">{productsError ? 'Products are unavailable until the load issue is resolved.' : products.length ? 'No products match your search.' : 'No products yet. Add your first product.'}</p>}
        </div>
      )}
          </>}
        </main>
      </div>
    </div>
  );
}