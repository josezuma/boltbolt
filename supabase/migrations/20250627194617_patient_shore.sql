/*
  # Comprehensive Database Policy Fix

  1. Problem
    - Some RLS policies may be blocking legitimate access to product data
    - Need to ensure all product-related data is accessible to public
    - Maintain security while allowing proper data access

  2. Solution
    - Review and fix all policies for product-related tables
    - Ensure public can access all active products, categories, brands
    - Fix any restrictive policies that block legitimate access
    - Maintain user-specific data protection

  3. Security
    - Keep user data protected (orders, wishlists, reviews)
    - Allow public access to product catalog data
    - Maintain admin controls where appropriate
*/

-- ============================================================================
-- BRANDS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active brands" ON brands;
DROP POLICY IF EXISTS "Admins can manage brands" ON brands;

-- Create new policies
CREATE POLICY "Public can read active brands"
  ON brands
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage brands"
  ON brands
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- CATEGORIES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Create new policies
CREATE POLICY "Public can read active categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- Create new policies
CREATE POLICY "Public can read active products"
  ON products
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- PRODUCT IMAGES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read product images" ON product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;

-- Create new policies
CREATE POLICY "Public can read product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage product images"
  ON product_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- PRODUCT VARIANTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;

-- Create new policies
CREATE POLICY "Public can read active product variants"
  ON product_variants
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage product variants"
  ON product_variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- PRODUCT REVIEWS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can create reviews for their purchases" ON product_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON product_reviews;

-- Create new policies
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

CREATE POLICY "Admins can manage all reviews"
  ON product_reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- WISHLISTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can insert into their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can delete from their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON wishlists;

-- Create new policies
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

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

-- Create new policies
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

CREATE POLICY "Admins can manage all orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- ORDER ITEMS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for own orders" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

-- Create new policies
CREATE POLICY "Users can read own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- SETTINGS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read settings" ON settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
DROP POLICY IF EXISTS "Allow settings creation" ON settings;
DROP POLICY IF EXISTS "Enable insert for settings" ON settings;

-- Create new policies
CREATE POLICY "Public can read settings"
  ON settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow settings creation"
  ON settings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can manage settings"
  ON settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- PAYMENT PROCESSORS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active payment processors" ON payment_processors;
DROP POLICY IF EXISTS "Admins can manage payment processors" ON payment_processors;

-- Create new policies
CREATE POLICY "Public can read active payment processors"
  ON payment_processors
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage payment processors"
  ON payment_processors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- PAYMENT TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can manage all payment transactions" ON payment_transactions;

-- Create new policies
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

CREATE POLICY "Admins can manage all payment transactions"
  ON payment_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- WEBHOOK EVENTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage webhook events" ON webhook_events;

-- Create new policies
CREATE POLICY "Admins can manage webhook events"
  ON webhook_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- PAYMENT REFUNDS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own payment refunds" ON payment_refunds;
DROP POLICY IF EXISTS "Admins can manage payment refunds" ON payment_refunds;

-- Create new policies
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

CREATE POLICY "Admins can manage payment refunds"
  ON payment_refunds
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- VERIFY ALL INDEXES EXIST FOR PERFORMANCE
-- ============================================================================

-- Ensure all necessary indexes exist for optimal query performance
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
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product ON wishlists(user_id, product_id);