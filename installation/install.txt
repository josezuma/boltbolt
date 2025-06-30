/*
  # BoltShop E-commerce Database Installation Script
  
  This script creates the complete database schema for the BoltShop e-commerce platform.
  It includes all tables, functions, triggers, and security policies needed for the application.
  
  ## Schema Overview:
  
  1. Core Tables:
     - users - User accounts with roles
     - categories - Product categories
     - brands - Product brands
     - products - Product catalog with variants and images
     - orders - Customer orders and items
     
  2. Product Features:
     - product_images - Multiple images per product
     - product_variants - Size, color variants
     - product_reviews - Customer reviews and ratings
     - product_attributes - Product characteristics
     
  3. Customer Features:
     - customer_profiles - Extended user information
     - customer_addresses - Shipping and billing addresses
     - wishlists - Saved products
     
  4. Order & Payment:
     - orders - Order information
     - order_items - Products in orders
     - payment_processors - Payment gateway configurations
     - payment_transactions - Payment records
     - payment_refunds - Refund information
     
  5. Marketing:
     - discounts - Promotions and coupons
     - discount_redemptions - Discount usage tracking
     
  6. Operations:
     - inventory_transactions - Stock movement tracking
     - webhook_events - Payment webhook processing
     - settings - Application configuration
*/

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- User roles (admin, customer)
CREATE TYPE user_role AS ENUM ('admin', 'customer');

-- Order status (pending, confirmed, shipped, delivered, cancelled)
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Payment status (pending, processing, succeeded, failed, cancelled, refunded, partially_refunded)
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded');

-- Discount type (percentage, fixed_amount)
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  user_role user_role;
BEGIN
  -- Count existing users to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- If this is the first user, make them admin
  IF user_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := 'customer';
  END IF;

  -- Insert the new user profile
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, user_role, now(), now());

  -- If this is the first user, set up initial settings
  IF user_count = 0 THEN
    INSERT INTO public.settings (key, value, created_at, updated_at) 
    VALUES ('first_user_created', 'true', now(), now())
    ON CONFLICT (key) DO UPDATE SET 
      value = 'true', 
      updated_at = now();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error with full context
    RAISE LOG 'Error in handle_new_user trigger for user % (email: %): %', 
      NEW.id, NEW.email, SQLERRM;
    -- Re-raise with a user-friendly message
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to create customer profile
CREATE OR REPLACE FUNCTION create_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a customer profile for the new user
  INSERT INTO customer_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE LOG 'Error creating customer profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle inventory updates
CREATE OR REPLACE FUNCTION handle_inventory_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track changes when stock is updated
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    INSERT INTO inventory_transactions (
      product_id,
      quantity,
      previous_stock,
      new_stock,
      transaction_type,
      reference_id,
      reference_type,
      created_by
    ) VALUES (
      NEW.id,
      NEW.stock - OLD.stock,
      OLD.stock,
      NEW.stock,
      CASE 
        WHEN NEW.stock > OLD.stock THEN 'stock_increase'
        ELSE 'stock_decrease'
      END,
      NULL,
      'manual_update',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_reviews
    SET helpful_count = GREATEST(helpful_count - 1, 0)
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update review reported status
CREATE OR REPLACE FUNCTION update_review_reported_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_reviews
  SET reported = true
  WHERE id = NEW.review_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  role user_role DEFAULT 'customer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table
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

-- Brands table
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

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  stock integer DEFAULT 0,
  image_url text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
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

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  sort_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text UNIQUE,
  price numeric(10,2),
  stock integer DEFAULT 0,
  attributes jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT true,
  helpful_count integer DEFAULT 0,
  reported boolean DEFAULT false,
  admin_response text,
  admin_response_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Review images table
CREATE TABLE IF NOT EXISTS review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES product_reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Review helpful votes table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Review reports table
CREATE TABLE IF NOT EXISTS review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  UNIQUE(review_id, user_id)
);

-- Product attributes table
CREATE TABLE IF NOT EXISTS product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name)
);

-- Product attribute values table
CREATE TABLE IF NOT EXISTS product_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, attribute_id)
);

-- Customer profiles table
CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  phone text,
  birth_date date,
  marketing_consent boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_type text NOT NULL DEFAULT 'shipping',
  is_default boolean DEFAULT false,
  first_name text NOT NULL,
  last_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  phone text,
  delivery_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  total_amount numeric(10,2) NOT NULL,
  stripe_payment_intent text,
  shipping_address jsonb,
  discount_id uuid,
  discount_amount numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  code text UNIQUE,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value numeric(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  is_automatic boolean DEFAULT false,
  minimum_purchase_amount numeric(10,2) DEFAULT 0,
  usage_limit integer DEFAULT NULL,
  usage_limit_per_customer integer DEFAULT NULL,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz DEFAULT NULL,
  applies_to_all_products boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Discount redemptions table
CREATE TABLE IF NOT EXISTS discount_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid REFERENCES discounts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  amount_discounted numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Discount products table
CREATE TABLE IF NOT EXISTS discount_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid REFERENCES discounts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(discount_id, product_id)
);

-- Discount categories table
CREATE TABLE IF NOT EXISTS discount_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(discount_id, category_id)
);

-- Payment processors table
CREATE TABLE IF NOT EXISTS payment_processors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  is_test_mode boolean DEFAULT false,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  webhook_endpoints jsonb DEFAULT '[]'::jsonb,
  webhook_secret text,
  supported_currencies text[] DEFAULT '{USD}'::text[],
  supported_countries text[] DEFAULT '{US}'::text[],
  supported_payment_methods text[] DEFAULT '{card}'::text[],
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  payment_processor_id uuid REFERENCES payment_processors(id) ON DELETE RESTRICT,
  processor_transaction_id text,
  processor_payment_intent_id text,
  processor_customer_id text,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status payment_status DEFAULT 'pending',
  payment_method jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  processor_response jsonb DEFAULT '{}'::jsonb,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  failed_at timestamptz
);

-- Payment refunds table
CREATE TABLE IF NOT EXISTS payment_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE CASCADE,
  processor_refund_id text,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL,
  reason text,
  status payment_status DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  processor_response jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_processor_id uuid REFERENCES payment_processors(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  processing_attempts integer DEFAULT 0,
  last_processing_error text,
  payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(payment_processor_id, event_id)
);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  transaction_type text NOT NULL,
  reference_id uuid,
  reference_type text,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE products 
  ADD CONSTRAINT products_featured_image_id_fkey 
  FOREIGN KEY (featured_image_id) REFERENCES product_images(id) ON DELETE SET NULL;

ALTER TABLE orders
  ADD CONSTRAINT orders_discount_id_fkey
  FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE SET NULL;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Users table policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for user creation"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Categories table policies
CREATE POLICY "Public can read active categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Brands table policies
CREATE POLICY "Public can read active brands"
  ON brands
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can insert brands"
  ON brands
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update brands"
  ON brands
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can delete brands"
  ON brands
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Products table policies
CREATE POLICY "Public can read active products"
  ON products
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Product images table policies
CREATE POLICY "Public can read product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert product images"
  ON product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update product images"
  ON product_images
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can delete product images"
  ON product_images
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Product variants table policies
CREATE POLICY "Public can read active product variants"
  ON product_variants
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can insert product variants"
  ON product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update product variants"
  ON product_variants
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can delete product variants"
  ON product_variants
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Product reviews table policies
CREATE POLICY "Public can read approved reviews"
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

CREATE POLICY "Admins can insert product reviews"
  ON product_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update product reviews"
  ON product_reviews
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can delete product reviews"
  ON product_reviews
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Review images table policies
CREATE POLICY "Public can read review images"
  ON review_images
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM product_reviews
      WHERE product_reviews.id = review_images.review_id
      AND product_reviews.is_approved = true
    )
  );

CREATE POLICY "Users can insert their own review images"
  ON review_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_reviews
      WHERE product_reviews.id = review_images.review_id
      AND product_reviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage review images"
  ON review_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Review helpful votes table policies
CREATE POLICY "Anyone can read helpful votes"
  ON review_helpful_votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can vote on reviews"
  ON review_helpful_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes"
  ON review_helpful_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Review reports table policies
CREATE POLICY "Users can report reviews"
  ON review_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage review reports"
  ON review_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Product attributes table policies
CREATE POLICY "Public can read product attributes"
  ON product_attributes
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage product attributes"
  ON product_attributes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Product attribute values table policies
CREATE POLICY "Public can read product attribute values"
  ON product_attribute_values
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_attribute_values.product_id
      AND products.is_active = true
    )
  );

CREATE POLICY "Admins can manage product attribute values"
  ON product_attribute_values
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Customer profiles table policies
CREATE POLICY "Users can read own profile"
  ON customer_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON customer_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON customer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Customer addresses table policies
CREATE POLICY "Users can read their own addresses"
  ON customer_addresses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own addresses"
  ON customer_addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own addresses"
  ON customer_addresses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own addresses"
  ON customer_addresses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all addresses"
  ON customer_addresses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Wishlists table policies
CREATE POLICY "Users can read their own wishlists"
  ON wishlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own wishlists"
  ON wishlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own wishlists"
  ON wishlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Orders table policies
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

CREATE POLICY "Admins can select all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Order items table policies
CREATE POLICY "Users can read own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can select all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update order items"
  ON order_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete order items"
  ON order_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Discounts table policies
CREATE POLICY "Public can read active discounts"
  ON discounts
  FOR SELECT
  TO public
  USING (
    is_active = true AND
    (ends_at IS NULL OR ends_at > now()) AND
    (starts_at IS NULL OR starts_at <= now())
  );

CREATE POLICY "Admins can insert discounts"
  ON discounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update discounts"
  ON discounts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete discounts"
  ON discounts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Discount redemptions table policies
CREATE POLICY "Users can read their own discount redemptions"
  ON discount_redemptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own discount redemptions"
  ON discount_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can select all discount redemptions"
  ON discount_redemptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert discount redemptions"
  ON discount_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Discount products table policies
CREATE POLICY "Public can read discount products"
  ON discount_products
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM discounts
      WHERE discounts.id = discount_products.discount_id
      AND discounts.is_active = true
      AND (discounts.ends_at IS NULL OR discounts.ends_at > now())
      AND (discounts.starts_at IS NULL OR discounts.starts_at <= now())
    )
  );

CREATE POLICY "Admins can manage discount products"
  ON discount_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Discount categories table policies
CREATE POLICY "Public can read discount categories"
  ON discount_categories
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM discounts
      WHERE discounts.id = discount_categories.discount_id
      AND discounts.is_active = true
      AND (discounts.ends_at IS NULL OR discounts.ends_at > now())
      AND (discounts.starts_at IS NULL OR discounts.starts_at <= now())
    )
  );

CREATE POLICY "Admins can manage discount categories"
  ON discount_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Payment processors table policies
CREATE POLICY "Public can read active payment processors"
  ON payment_processors
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can insert payment processors"
  ON payment_processors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment processors"
  ON payment_processors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete payment processors"
  ON payment_processors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Payment transactions table policies
CREATE POLICY "Users can read their own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payment_transactions.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can select all payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert payment transactions"
  ON payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment transactions"
  ON payment_transactions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete payment transactions"
  ON payment_transactions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Payment refunds table policies
CREATE POLICY "Users can read their own payment refunds"
  ON payment_refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment_transactions pt
      JOIN orders o ON o.id = pt.order_id
      WHERE pt.id = payment_refunds.payment_transaction_id 
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can select payment refunds"
  ON payment_refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert payment refunds"
  ON payment_refunds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment refunds"
  ON payment_refunds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete payment refunds"
  ON payment_refunds
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Webhook events table policies
CREATE POLICY "Admins can select webhook events"
  ON webhook_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert webhook events"
  ON webhook_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update webhook events"
  ON webhook_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete webhook events"
  ON webhook_events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Inventory transactions table policies
CREATE POLICY "Admins can manage inventory transactions"
  ON inventory_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Settings table policies
CREATE POLICY "Anyone can read settings"
  ON settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow settings creation"
  ON settings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can insert settings"
  ON settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update settings"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete settings"
  ON settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger for auth.users to create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger for users to create customer profile
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_customer_profile();

-- Trigger for inventory tracking
CREATE TRIGGER track_product_inventory_changes
  AFTER UPDATE OF stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_inventory_update();

-- Trigger for review helpful votes
CREATE TRIGGER update_helpful_count_on_vote
  AFTER INSERT OR DELETE ON review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- Trigger for review reports
CREATE TRIGGER update_reported_status_on_report
  AFTER INSERT ON review_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_review_reported_status();

-- Trigger for updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
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

CREATE TRIGGER update_product_attributes_updated_at
  BEFORE UPDATE ON product_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_attribute_values_updated_at
  BEFORE UPDATE ON product_attribute_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounts_updated_at
  BEFORE UPDATE ON discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_processors_updated_at
  BEFORE UPDATE ON payment_processors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_refunds_updated_at
  BEFORE UPDATE ON payment_refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Categories indexes
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Brands indexes
CREATE INDEX idx_brands_active ON brands(is_active);
CREATE INDEX idx_brands_slug ON brands(slug);

-- Products indexes
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_tags ON products USING gin(tags);

-- Product images indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_featured ON product_images(is_featured);
CREATE INDEX idx_product_images_sort ON product_images(product_id, sort_order);

-- Product variants indexes
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_active ON product_variants(is_active);

-- Product reviews indexes
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_approved ON product_reviews(is_approved);
CREATE INDEX idx_product_reviews_helpful_count ON product_reviews(helpful_count);
CREATE INDEX idx_product_reviews_reported ON product_reviews(reported);

-- Review images indexes
CREATE INDEX idx_review_images_review_id ON review_images(review_id);

-- Review helpful votes indexes
CREATE INDEX idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX idx_review_helpful_votes_user_id ON review_helpful_votes(user_id);

-- Review reports indexes
CREATE INDEX idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX idx_review_reports_user_id ON review_reports(user_id);
CREATE INDEX idx_review_reports_resolved ON review_reports(resolved);

-- Product attribute values indexes
CREATE INDEX idx_product_attribute_values_product_id ON product_attribute_values(product_id);
CREATE INDEX idx_product_attribute_values_attribute_id ON product_attribute_values(attribute_id);

-- Customer addresses indexes
CREATE INDEX idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX idx_customer_addresses_default ON customer_addresses(user_id, is_default);

-- Wishlists indexes
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX idx_wishlists_user_product ON wishlists(user_id, product_id);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_discount_id ON orders(discount_id);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Discounts indexes
CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_active ON discounts(is_active);
CREATE INDEX idx_discounts_automatic ON discounts(is_automatic);
CREATE INDEX idx_discounts_dates ON discounts(starts_at, ends_at);

-- Discount redemptions indexes
CREATE INDEX idx_discount_redemptions_discount_id ON discount_redemptions(discount_id);
CREATE INDEX idx_discount_redemptions_user_id ON discount_redemptions(user_id);
CREATE INDEX idx_discount_redemptions_order_id ON discount_redemptions(order_id);

-- Discount products indexes
CREATE INDEX idx_discount_products_discount_id ON discount_products(discount_id);
CREATE INDEX idx_discount_products_product_id ON discount_products(product_id);

-- Discount categories indexes
CREATE INDEX idx_discount_categories_discount_id ON discount_categories(discount_id);
CREATE INDEX idx_discount_categories_category_id ON discount_categories(category_id);

-- Payment processors indexes
CREATE INDEX idx_payment_processors_name ON payment_processors(name);
CREATE INDEX idx_payment_processors_active ON payment_processors(is_active);

-- Payment transactions indexes
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_processor_id ON payment_transactions(payment_processor_id);
CREATE INDEX idx_payment_transactions_processor_transaction_id ON payment_transactions(processor_transaction_id);
CREATE INDEX idx_payment_transactions_processor_payment_intent_id ON payment_transactions(processor_payment_intent_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- Payment refunds indexes
CREATE INDEX idx_payment_refunds_transaction_id ON payment_refunds(payment_transaction_id);
CREATE INDEX idx_payment_refunds_processor_refund_id ON payment_refunds(processor_refund_id);
CREATE INDEX idx_payment_refunds_status ON payment_refunds(status);

-- Webhook events indexes
CREATE INDEX idx_webhook_events_processor_id ON webhook_events(payment_processor_id);
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_transaction_id ON webhook_events(payment_transaction_id);

-- Inventory transactions indexes
CREATE INDEX idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_variant_id ON inventory_transactions(variant_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_reference ON inventory_transactions(reference_id, reference_type);

-- ============================================================================
-- INSERT DEFAULT SETTINGS
-- ============================================================================

INSERT INTO settings (key, value)
VALUES 
  ('store_name', '"BOLTSHOP"'::jsonb),
  ('store_description', '"Premium fashion and lifestyle products for the modern individual"'::jsonb),
  ('store_email', '"hello@boltshop.com"'::jsonb),
  ('store_phone', '"+1 (555) 123-4567"'::jsonb),
  ('store_address', '{"street": "123 Fashion Avenue", "city": "New York", "state": "NY", "zip": "10001", "country": "US"}'::jsonb),
  ('currency', '"USD"'::jsonb),
  ('tax_rate', '0.08'::jsonb),
  ('free_shipping_threshold', '50'::jsonb),
  ('store_logo', '""'::jsonb),
  ('store_favicon', '""'::jsonb),
  ('store_primary_color', '"#2A2A2A"'::jsonb),
  ('store_secondary_color', '"#EAEAEA"'::jsonb),
  ('store_font', '"Inter"'::jsonb),
  ('store_timezone', '"UTC"'::jsonb),
  ('store_language', '"en"'::jsonb),
  ('shipping_enabled', 'true'::jsonb),
  ('tax_enabled', 'true'::jsonb),
  ('inventory_tracking', 'true'::jsonb),
  ('customer_accounts', 'true'::jsonb),
  ('email_notifications', 'true'::jsonb),
  ('analytics_enabled', 'false'::jsonb),
  ('google_analytics_id', '""'::jsonb),
  ('facebook_pixel_id', '""'::jsonb),
  ('seo_title', '"BOLTSHOP - Premium Fashion & Lifestyle"'::jsonb),
  ('seo_description', '"Discover premium fashion and lifestyle products at BOLTSHOP. Quality, style, and sustainability in every product."'::jsonb),
  ('seo_keywords', '"fashion, lifestyle, premium, sustainable, clothing"'::jsonb),
  ('social_sharing', 'true'::jsonb),
  ('newsletter_enabled', 'true'::jsonb),
  ('reviews_enabled', 'true'::jsonb),
  ('wishlist_enabled', 'true'::jsonb),
  ('search_enabled', 'true'::jsonb),
  ('blog_enabled', 'false'::jsonb),
  ('maintenance_mode', 'false'::jsonb),
  ('order_notifications', 'true'::jsonb),
  ('low_stock_notifications', 'true'::jsonb),
  ('customer_notifications', 'true'::jsonb),
  ('stripe_test_mode', 'true'::jsonb),
  ('stripe_publishable_key', '""'::jsonb),
  ('stripe_secret_key', '""'::jsonb),
  ('stripe_webhook_secret', '""'::jsonb),
  ('paypal_enabled', 'false'::jsonb),
  ('paypal_client_id', '""'::jsonb),
  ('paypal_client_secret', '""'::jsonb),
  ('free_shipping_threshold', '50'::jsonb),
  ('default_shipping_rate', '5.99'::jsonb),
  ('international_shipping', 'false'::jsonb),
  ('tax_inclusive', 'false'::jsonb),
  ('default_tax_rate', '0.08'::jsonb),
  ('smtp_enabled', 'false'::jsonb),
  ('smtp_host', '""'::jsonb),
  ('smtp_port', '587'::jsonb),
  ('smtp_username', '""'::jsonb),
  ('smtp_password', '""'::jsonb),
  ('from_email', '""'::jsonb),
  ('from_name', '""'::jsonb),
  ('onboarding_completed', 'false'::jsonb),
  ('setup_step', '0'::jsonb),
  ('store_configured', 'false'::jsonb),
  ('payment_configured', 'false'::jsonb),
  ('products_added', 'false'::jsonb),
  ('design_configured', 'false'::jsonb),
  ('promo_banner', '{"text": "Free shipping on all orders over $50", "link": "/products", "enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert default Stripe payment processor
INSERT INTO payment_processors (
  name, 
  display_name, 
  description,
  is_active,
  is_test_mode,
  configuration,
  webhook_endpoints,
  supported_currencies,
  supported_countries,
  supported_payment_methods,
  settings
) VALUES (
  'stripe',
  'Stripe',
  'Stripe payment processor for credit cards and digital wallets',
  true,
  true, -- Start in test mode
  '{
      "publishable_key": "",
      "secret_key": "",
      "webhook_secret": ""
  }',
  '[
      {
          "url": "/api/webhooks/stripe",
          "events": [
              "payment_intent.succeeded",
              "payment_intent.payment_failed",
              "charge.dispute.created",
              "invoice.payment_succeeded",
              "customer.subscription.updated"
          ]
      }
  ]',
  '{"USD", "EUR", "GBP", "CAD", "AUD", "JPY"}',
  '{"US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "NL", "JP"}',
  '{"card", "apple_pay", "google_pay", "link", "klarna", "afterpay_clearpay"}',
  '{
      "capture_method": "automatic",
      "confirmation_method": "automatic",
      "setup_future_usage": "off_session",
      "statement_descriptor": "BOLTSHOP"
  }'
) ON CONFLICT (name) DO NOTHING;

-- Insert sample product attributes
INSERT INTO product_attributes (name, display_name, description)
VALUES 
  ('size', 'Size', 'Product size'),
  ('color', 'Color', 'Product color'),
  ('material', 'Material', 'Product material'),
  ('weight', 'Weight', 'Product weight in grams')
ON CONFLICT (name) DO NOTHING;