import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, FolderPen, PackagePlus, Plus, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Category, type Order, type Product } from '@/lib/supabase';
import { isCategoryIconUrl } from '@/lib/icons';
import { getOrderStatus, orderStatuses } from '@/lib/orderStatus';
import { formatPrice } from '@/lib/utils';

type AdminPageProps = {
  onBack: () => void;
};

export function AdminPage({ onBack }: AdminPageProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '', icon: 'Package' });
  const [newProduct, setNewProduct] = useState({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    price: 0,
    feature_price: 10000,
    stock: 100,
    image_url: '',
    file_type: 'ZIP',
    file_size: '1 MB',
    tags: '',
  });

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
      const orderResult = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (productResult.error) setMessage(productResult.error.message);
      if (orderResult.error) setMessage(orderResult.error.message);
      setProducts((productResult.data as Product[] | null) ?? []);
      setCategories((categoryResult.data as Category[] | null) ?? []);
      setOrders((orderResult.data as Order[] | null) ?? []);
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

  const updateProduct = (productId: string, changes: Partial<Product>) => {
    setProducts((current) => current.map((product) =>
      product.id === productId ? { ...product, ...changes } : product
    ));
  };

  const saveProduct = async (product: Product) => {
    setSavingId(product.id);
    setMessage('');
    const { error } = await supabase.from('products').update({
      name: product.name.trim(),
      price: product.price,
      feature_price: product.feature_price,
      duration_prices: product.duration_prices,
      stock: product.stock,
    }).eq('id', product.id);

    setMessage(error ? error.message : `${product.name} saved.`);
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
      setMessage(`${product.name} deleted from the catalog.`);
    }
    setDeletingId(null);
  };

  const updateCategory = (categoryId: string, changes: Partial<Category>) => {
    setCategories((current) => current.map((category) =>
      category.id === categoryId ? { ...category, ...changes } : category
    ));
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
    setAddingProduct(true);
    setMessage('');
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
      slug,
      description: newProduct.description.trim(),
      category_id: newProduct.category_id || null,
      price: basePrice,
      original_price: null,
      feature_price: Number(newProduct.feature_price),
      duration_prices,
      stock: Number(newProduct.stock),
      image_url: newProduct.image_url.trim() || null,
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
        name: '', slug: '', description: '', category_id: '', price: 0,
        feature_price: 10000, stock: 100, image_url: '', file_type: 'ZIP', file_size: '1 MB', tags: '',
      });
      setShowAddForm(false);
      setMessage(`${name} added to the catalog.`);
    }
    setAddingProduct(false);
  };

  const lowStockCount = products.filter((product) => product.stock <= 5).length;
  const totalStock = products.reduce((total, product) => total + product.stock, 0);

  if (user?.app_metadata.role !== 'admin') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Administrator access required</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in with an account assigned the admin role.</p>
        <button onClick={onBack} className="mt-5 text-sm font-medium text-blue-700">Back to store</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to store
      </button>
      <div className="mb-7 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 px-6 py-7 text-white shadow-lg shadow-indigo-200 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-100">
              <PackagePlus size={17} /> SmartNova catalog control
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Product dashboard</h1>
            <p className="mt-2 max-w-xl text-sm text-blue-100">Update your catalog, pricing, and inventory from one colorful workspace.</p>
          </div>
          <button
            onClick={() => setShowAddForm((visible) => !visible)}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-blue-50"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? 'Close form' : 'Add product'}
          </button>
        </div>
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Catalog overview</h2>
          <p className="mt-1 text-sm text-slate-500">Manage inventory and pricing in Indonesian rupiah (IDR).</p>
        </div>
      </div>

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

      {message && <p role="status" className="mb-4 text-sm text-blue-700">{message}</p>}
      <section className="mb-7 rounded-xl border border-cyan-100 bg-cyan-50/60 p-5 shadow-sm">
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
      </section>
      <section className="mb-7 rounded-xl border border-violet-100 bg-violet-50/60 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-900">
              <FolderPen size={17} /> Category management
            </div>
            <p className="mt-1 text-xs text-violet-700">Add, edit, or remove the categories used by your products.</p>
          </div>
          <button
            onClick={() => setShowCategoryForm((visible) => !visible)}
            className="flex items-center gap-2 rounded-md bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800"
          >
            {showCategoryForm ? <X size={16} /> : <Plus size={16} />}
            {showCategoryForm ? 'Close' : 'Add category'}
          </button>
        </div>
        {showCategoryForm && (
          <form onSubmit={createCategory} className="mt-5 grid gap-3 border-t border-violet-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="flex justify-end sm:col-span-2 lg:col-span-4">
              <button type="submit" disabled={addingCategory} className="flex items-center gap-2 rounded-md bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">
                <Plus size={16} /> {addingCategory ? 'Adding...' : 'Create category'}
              </button>
            </div>
          </form>
        )}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {categories.map((category) => (
            <div key={category.id} className="rounded-lg border border-violet-100 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-600">
                  Name
                  <input value={category.name} onChange={(event) => updateCategory(category.id, { name: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm font-semibold text-slate-900" />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  Slug
                  <input value={category.slug} onChange={(event) => updateCategory(category.id, { slug: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-900" />
                </label>
                <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                  Description
                  <input value={category.description ?? ''} onChange={(event) => updateCategory(category.id, { description: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-900" />
                </label>
                <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                  Icon name or ImageKit/Google Drive URL
                  <input value={category.icon} onChange={(event) => updateCategory(category.id, { icon: event.target.value })} placeholder="Package or https://..." className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-900" />
                </label>
              </div>
              {isCategoryIconUrl(category.icon) && (
                <img src={category.icon} alt="Category icon preview" className="mt-3 h-14 w-14 rounded-lg border border-slate-200 object-cover" />
              )}
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => void saveCategory(category)} disabled={savingCategoryId === category.id || deletingCategoryId === category.id} className="flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  <Save size={14} /> Save
                </button>
                <button onClick={() => void deleteCategory(category)} disabled={savingCategoryId === category.id || deletingCategoryId === category.id} className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {showAddForm && (
        <form onSubmit={createProduct} className="mb-7 rounded-xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">New product</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-slate-600">
              Product name
              <input required value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
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
              Description
              <textarea required rows={3} value={newProduct.description} onChange={(event) => setNewProduct({ ...newProduct, description: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600 sm:col-span-2">
              Image URL
              <input type="url" value={newProduct.image_url} onChange={(event) => setNewProduct({ ...newProduct, image_url: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
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
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading products...</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <section key={product.id} className="rounded-xl border border-slate-200 border-l-4 border-l-blue-500 bg-white p-5 shadow-sm transition hover:shadow-md lg:grid lg:grid-cols-[minmax(150px,1fr)_150px_150px_125px_2fr_auto] lg:items-end">
              <div className="min-w-0">
                <label className="text-xs font-medium text-slate-600">
                  Product name
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
                  onClick={() => void saveProduct(product)}
                  disabled={savingId === product.id || deletingId === product.id}
                  aria-label={`Save changes for ${product.name}`}
                  title="Save changes"
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingId === product.id ? <CheckCircle2 size={17} /> : <Save size={17} />}
                  <span className="lg:hidden">Save</span>
                </button>
                <button
                  onClick={() => void deleteProduct(product)}
                  disabled={savingId === product.id || deletingId === product.id}
                  aria-label={`Delete ${product.name}`}
                  title="Delete product"
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                >
                  <Trash2 size={17} />
                  <span className="lg:hidden">Delete</span>
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}