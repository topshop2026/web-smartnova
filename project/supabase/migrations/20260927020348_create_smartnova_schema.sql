/*
# SmartNova Digital Products Store Schema

## Overview
Creates the database schema for SmartNova, a digital products marketplace.
Single-tenant (no auth) app — all data is publicly browsable.

## New Tables

### categories
- `id` (uuid, PK)
- `name` (text, unique, not null)
- `slug` (text, unique, not null)
- `description` (text)
- `icon` (text) — lucide icon name
- `display_order` (int, default 0)

### products
- `id` (uuid, PK)
- `name` (text, not null)
- `slug` (text, unique, not null)
- `description` (text, not null)
- `price` (numeric(10,2), not null)
- `original_price` (numeric(10,2)) — for showing discounts
- `category_id` (uuid, FK to categories)
- `image_url` (text) — cover/thumbnail image
- `preview_url` (text) — optional preview/demo link
- `file_type` (text) — e.g. PDF, ZIP, FIG, PSD
- `file_size` (text) — human readable size
- `tags` (text[]) — searchable tags
- `rating` (numeric(2,1), default 0)
- `review_count` (int, default 0)
- `sales_count` (int, default 0)
- `is_featured` (boolean, default false)
- `is_bestseller` (boolean, default false)
- `is_new` (boolean, default false)
- `created_at` (timestamptz, default now())

### product_reviews
- `id` (uuid, PK)
- `product_id` (uuid, FK to products, cascade delete)
- `author_name` (text, not null)
- `rating` (int, 1-5, not null)
- `comment` (text, not null)
- `created_at` (timestamptz, default now())

### orders
- `id` (uuid, PK)
- `order_number` (text, unique, not null)
- `customer_email` (text, not null)
- `customer_name` (text, not null)
- `total_amount` (numeric(10,2), not null)
- `status` (text, default 'pending')
- `items_json` (jsonb) — snapshot of purchased items
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on all tables.
- All tables allow anon + authenticated read (public catalog).
- Orders allow anon + authenticated insert (guest checkout).
- Reviews allow anon + authenticated insert.
- No updates/deletes from the frontend.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text DEFAULT 'Package',
  display_order int DEFAULT 0
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  preview_url text,
  file_type text,
  file_size text,
  tags text[] DEFAULT '{}',
  rating numeric(2,1) DEFAULT 0,
  review_count int DEFAULT 0,
  sales_count int DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_bestseller boolean DEFAULT false,
  is_new boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reviews" ON product_reviews;
CREATE POLICY "anon_select_reviews" ON product_reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reviews" ON product_reviews;
CREATE POLICY "anon_insert_reviews" ON product_reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending',
  items_json jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);

-- Starter catalog for a fresh SmartNova database.
INSERT INTO categories (name, slug, description, icon, display_order) VALUES
  ('Website Templates', 'website-templates', 'Ready-to-customize website designs for modern brands.', 'LayoutTemplate', 1),
  ('UI Kits', 'ui-kits', 'Reusable interface components and design systems.', 'Component', 2),
  ('E-books', 'ebooks', 'Practical guides for creative and technical work.', 'BookOpen', 3),
  ('Graphics', 'graphics', 'Illustrations, icon sets, and visual assets.', 'Palette', 4),
  ('Development', 'development', 'Starter code and tools for product teams.', 'Code2', 5),
  ('Courses', 'courses', 'Focused learning materials for growing your skills.', 'GraduationCap', 6),
  ('Audio', 'audio', 'Music and sound assets for digital projects.', 'Music', 7),
  ('3D Assets', '3d-assets', 'Models and materials for three-dimensional work.', 'Box', 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;

INSERT INTO products (
  name, slug, description, price, original_price, category_id, image_url,
  preview_url, file_type, file_size, tags, rating, review_count,
  sales_count, is_featured, is_bestseller, is_new
) VALUES
  (
    'SaaS Landing Page Kit', 'saas-landing-page-kit',
    'A polished, responsive landing page system with pricing, feature, and testimonial sections for early-stage SaaS products.',
    29.00, 49.00, (SELECT id FROM categories WHERE slug = 'website-templates'),
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85',
    NULL, 'FIG', '18 MB', ARRAY['landing page', 'saas', 'responsive'], 4.9, 128, 1842, true, true, false
  ),
  (
    'Studio UI Design System', 'studio-ui-design-system',
    'A flexible interface library with accessible components, typography styles, and carefully tuned light and dark themes.',
    39.00, 59.00, (SELECT id FROM categories WHERE slug = 'ui-kits'),
    'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=85',
    NULL, 'FIG', '24 MB', ARRAY['ui kit', 'design system', 'components'], 4.8, 96, 1274, true, true, false
  ),
  (
    'The Practical Design Handbook', 'practical-design-handbook',
    'A concise, illustrated guide to building consistent layouts, choosing type, and making better everyday design decisions.',
    18.00, NULL, (SELECT id FROM categories WHERE slug = 'ebooks'),
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=85',
    NULL, 'PDF', '8 MB', ARRAY['design', 'ebook', 'guide'], 4.7, 54, 708, true, false, true
  ),
  (
    'Organic Shapes Illustration Pack', 'organic-shapes-illustration-pack',
    'A versatile collection of editable abstract shapes and illustrations for presentations, websites, and social campaigns.',
    16.00, 24.00, (SELECT id FROM categories WHERE slug = 'graphics'),
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=85',
    NULL, 'ZIP', '42 MB', ARRAY['illustrations', 'graphics', 'abstract'], 4.8, 72, 936, true, false, false
  ),
  (
    'Modern React Starter', 'modern-react-starter',
    'A clean, production-minded starter with routing, reusable components, responsive layouts, and a practical project structure.',
    34.00, NULL, (SELECT id FROM categories WHERE slug = 'development'),
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85',
    NULL, 'ZIP', '12 MB', ARRAY['react', 'typescript', 'starter'], 4.9, 83, 1106, true, true, true
  ),
  (
    'Product Design Foundations', 'product-design-foundations',
    'A self-paced course covering research, prototyping, interface fundamentals, and presenting a complete product case study.',
    59.00, 79.00, (SELECT id FROM categories WHERE slug = 'courses'),
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85',
    NULL, 'VIDEO', '2.4 GB', ARRAY['course', 'product design', 'ux'], 4.9, 61, 492, true, false, false
  ),
  (
    'Ambient Focus Sound Library', 'ambient-focus-sound-library',
    'A curated library of original ambient tracks and subtle sound beds for focused work, apps, and creative projects.',
    22.00, NULL, (SELECT id FROM categories WHERE slug = 'audio'),
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=85',
    NULL, 'WAV', '680 MB', ARRAY['audio', 'ambient', 'music'], 4.6, 37, 318, false, false, true
  ),
  (
    'Everyday Objects 3D Pack', 'everyday-objects-3d-pack',
    'A set of clean, studio-lit everyday object models with organized materials, ready for product mockups and visual scenes.',
    27.00, 39.00, (SELECT id FROM categories WHERE slug = '3d-assets'),
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=85',
    NULL, 'BLEND', '156 MB', ARRAY['3d', 'blender', 'models'], 4.7, 29, 263, false, false, true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  category_id = EXCLUDED.category_id,
  image_url = EXCLUDED.image_url,
  preview_url = EXCLUDED.preview_url,
  file_type = EXCLUDED.file_type,
  file_size = EXCLUDED.file_size,
  tags = EXCLUDED.tags,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  sales_count = EXCLUDED.sales_count,
  is_featured = EXCLUDED.is_featured,
  is_bestseller = EXCLUDED.is_bestseller,
  is_new = EXCLUDED.is_new;
