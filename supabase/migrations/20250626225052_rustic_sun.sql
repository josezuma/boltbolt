/*
  # Complete E-commerce Database Schema

  1. New Tables
    - `users` - User profiles with roles
    - `brands` - Product brands
    - `categories` - Product categories  
    - `products` - Main products table with enhanced fields
    - `product_images` - Multiple images per product
    - `product_variants` - Product variations (size, color, etc.)
    - `product_reviews` - Customer reviews
    - `orders` - Customer orders
    - `order_items` - Items within orders
    - `wishlists` - User wishlists
    - `settings` - Application settings

  2. Security
    - Enable RLS on all tables
    - Admin policies for management
    - User-specific policies for personal data
    - Public read access for active products/categories

  3. Features
    - Multi-image support for products
    - Product variants and reviews
    - Complete order management
    - User roles and permissions
*/

-- Create custom types only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'customer');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
    END IF;
END $$;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT auth.uid(),
    email text UNIQUE NOT NULL,
    role user_role DEFAULT 'customer',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can read own profile"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    logo_url text,
    website_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage brands" ON brands;
DROP POLICY IF EXISTS "Anyone can read active brands" ON brands;

CREATE POLICY "Admins can manage brands"
    ON brands
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Anyone can read active brands"
    ON brands
    FOR SELECT
    TO public
    USING (is_active = true);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can read active categories" ON categories;

CREATE POLICY "Admins can manage categories"
    ON categories
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Anyone can read active categories"
    ON categories
    FOR SELECT
    TO public
    USING (is_active = true);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    stock integer DEFAULT 0,
    image_url text,
    category_id uuid,
    brand_id uuid,
    featured_image_id uuid,
    sku text UNIQUE,
    weight numeric(8,2),
    dimensions jsonb,
    tags text[],
    material text,
    care_instructions text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Anyone can read active products" ON products;

CREATE POLICY "Admins can manage products"
    ON products
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Anyone can read active products"
    ON products
    FOR SELECT
    TO public
    USING (is_active = true);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid,
    image_url text NOT NULL,
    alt_text text,
    sort_order integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;
DROP POLICY IF EXISTS "Anyone can read product images" ON product_images;

CREATE POLICY "Admins can manage product images"
    ON product_images
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Anyone can read product images"
    ON product_images
    FOR SELECT
    TO public
    USING (true);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid,
    name text NOT NULL,
    sku text UNIQUE,
    price numeric(10,2),
    stock integer DEFAULT 0,
    attributes jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can read active product variants" ON product_variants;

CREATE POLICY "Admins can manage product variants"
    ON product_variants
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Anyone can read active product variants"
    ON product_variants
    FOR SELECT
    TO public
    USING (is_active = true);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid,
    user_id uuid,
    rating integer,
    title text,
    comment text,
    is_verified_purchase boolean DEFAULT false,
    is_approved boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage all reviews" ON product_reviews;
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can create reviews for their purchases" ON product_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON product_reviews;

CREATE POLICY "Admins can manage all reviews"
    ON product_reviews
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Anyone can read approved reviews"
    ON product_reviews
    FOR SELECT
    TO public
    USING (is_approved = true);

CREATE POLICY "Users can create reviews for their purchases"
    ON product_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON product_reviews
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    status order_status DEFAULT 'pending',
    total_amount numeric(10,2) NOT NULL,
    stripe_payment_intent text,
    shipping_address jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;

CREATE POLICY "Admins can manage all orders"
    ON orders
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Users can read own orders"
    ON orders
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders"
    ON orders
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid,
    product_id uuid,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for own orders" ON order_items;

CREATE POLICY "Admins can manage all order items"
    ON order_items
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Users can read own order items"
    ON order_items
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    ));

CREATE POLICY "Users can create order items for own orders"
    ON order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    ));

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    product_id uuid,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON wishlists;

CREATE POLICY "Users can manage their own wishlists"
    ON wishlists
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
DROP POLICY IF EXISTS "Anyone can read settings" ON settings;

CREATE POLICY "Admins can manage settings"
    ON settings
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Anyone can read settings"
    ON settings
    FOR SELECT
    TO public
    USING (true);

-- Add foreign key constraints
DO $$
BEGIN
    -- Add foreign key constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_category_id_fkey'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_brand_id_fkey'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_brand_id_fkey 
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_featured_image_id_fkey'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_featured_image_id_fkey 
        FOREIGN KEY (featured_image_id) REFERENCES product_images(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_images_product_id_fkey'
    ) THEN
        ALTER TABLE product_images 
        ADD CONSTRAINT product_images_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_variants_product_id_fkey'
    ) THEN
        ALTER TABLE product_variants 
        ADD CONSTRAINT product_variants_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_reviews_product_id_fkey'
    ) THEN
        ALTER TABLE product_reviews 
        ADD CONSTRAINT product_reviews_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_reviews_user_id_fkey'
    ) THEN
        ALTER TABLE product_reviews 
        ADD CONSTRAINT product_reviews_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_fkey'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_order_id_fkey'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_product_id_fkey'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'wishlists_user_id_fkey'
    ) THEN
        ALTER TABLE wishlists 
        ADD CONSTRAINT wishlists_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'wishlists_product_id_fkey'
    ) THEN
        ALTER TABLE wishlists 
        ADD CONSTRAINT wishlists_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;

    -- Add unique constraint for wishlists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'wishlists_user_id_product_id_key'
    ) THEN
        ALTER TABLE wishlists 
        ADD CONSTRAINT wishlists_user_id_product_id_key 
        UNIQUE (user_id, product_id);
    END IF;

    -- Add check constraint for product reviews rating
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_reviews_rating_check'
    ) THEN
        ALTER TABLE product_reviews 
        ADD CONSTRAINT product_reviews_rating_check 
        CHECK (rating >= 1 AND rating <= 5);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_featured ON product_images(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- Create triggers for updated_at columns (drop existing first)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new user handling (drop existing first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Insert some sample data for testing
INSERT INTO brands (name, slug, description, is_active) VALUES
    ('Premium Brand', 'premium-brand', 'A luxury fashion brand', true),
    ('Eco Fashion', 'eco-fashion', 'Sustainable and eco-friendly clothing', true),
    ('Urban Style', 'urban-style', 'Modern urban fashion', true),
    ('Classic Wear', 'classic-wear', 'Timeless classic clothing', true),
    ('Sport Active', 'sport-active', 'Active and sportswear', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, is_active) VALUES
    ('Clothing', 'clothing', 'All types of clothing', true),
    ('Accessories', 'accessories', 'Fashion accessories', true),
    ('Shoes', 'shoes', 'Footwear collection', true),
    ('Bags', 'bags', 'Handbags and backpacks', true),
    ('Jewelry', 'jewelry', 'Fashion jewelry', true),
    ('Home & Living', 'home-living', 'Home decor and living essentials', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, slug, description, price, stock, category_id, brand_id, is_active) 
SELECT 
    'Premium Cotton T-Shirt',
    'premium-cotton-t-shirt',
    'High-quality cotton t-shirt with premium finish',
    29.99,
    50,
    c.id,
    b.id,
    true
FROM categories c, brands b 
WHERE c.slug = 'clothing' AND b.slug = 'premium-brand'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, stock, category_id, brand_id, is_active) 
SELECT 
    'Eco-Friendly Jeans',
    'eco-friendly-jeans',
    'Sustainable denim jeans made from organic cotton',
    89.99,
    25,
    c.id,
    b.id,
    true
FROM categories c, brands b 
WHERE c.slug = 'clothing' AND b.slug = 'eco-fashion'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, stock, category_id, brand_id, is_active) 
SELECT 
    'Urban Sneakers',
    'urban-sneakers',
    'Comfortable urban-style sneakers for everyday wear',
    129.99,
    30,
    c.id,
    b.id,
    true
FROM categories c, brands b 
WHERE c.slug = 'shoes' AND b.slug = 'urban-style'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, stock, category_id, brand_id, is_active) 
SELECT 
    'Classic Leather Bag',
    'classic-leather-bag',
    'Timeless leather handbag with classic design',
    199.99,
    15,
    c.id,
    b.id,
    true
FROM categories c, brands b 
WHERE c.slug = 'bags' AND b.slug = 'classic-wear'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, stock, category_id, brand_id, is_active) 
SELECT 
    'Sport Watch',
    'sport-watch',
    'Durable sport watch for active lifestyle',
    159.99,
    20,
    c.id,
    b.id,
    true
FROM categories c, brands b 
WHERE c.slug = 'accessories' AND b.slug = 'sport-active'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, stock, category_id, brand_id, is_active) 
SELECT 
    'Minimalist Necklace',
    'minimalist-necklace',
    'Simple and elegant minimalist necklace',
    49.99,
    40,
    c.id,
    b.id,
    true
FROM categories c, brands b 
WHERE c.slug = 'jewelry' AND b.slug = 'premium-brand'
ON CONFLICT (slug) DO NOTHING;