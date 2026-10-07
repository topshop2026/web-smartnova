import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  display_order: number;
};

export type Product = {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  description: string;
  description_en: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  feature_price: number;
  duration_prices: DurationPrice[];
  category_id: string | null;
  image_url: string | null;
  image_urls: string[];
  preview_url: string | null;
  file_type: string | null;
  file_size: string | null;
  tags: string[];
  rating: number;
  review_count: number;
  sales_count: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  created_at: string;
};

export type DurationPrice = {
  days: number;
  surcharge: number;
};

export type ProductConfiguration = {
  days: number;
  features: number;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type EditorialTestimonial = {
  id: string;
  product_id: string;
  author_name: string;
  quote: string;
  created_at: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  days: number;
  features: number;
  unitPrice: number;
};

export type OrderItem = {
  product_id?: string;
  product_name?: string;
  product_name_en?: string | null;
  unit_price?: number;
  days?: number;
  features?: number;
  quantity?: number;
  product?: Pick<Product, 'name'>;
  unitPrice?: number;
};

export type Order = {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  status: string;
  fulfillment_status: string;
  payment_redirect_url: string | null;
  items_json: OrderItem[];
  created_at: string;
  payment_completed_at: string | null;
};
