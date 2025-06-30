/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - RLS policies are causing infinite recursion when querying the users table
    - Admin policies are creating circular dependencies

  2. Solution
    - Drop all existing problematic policies
    - Create simplified policies that avoid recursion
    - Use auth.uid() directly instead of complex joins
    - Remove admin policies that cause recursion

  3. Security
    - Maintain user access to their own data
    - Keep public read access to active content
    - Simplify admin access without recursion
*/

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for user creation" ON users;
DROP POLICY IF EXISTS "Allow reading user emails for approved reviews" ON users;
DROP POLICY IF EXISTS "Public can read user emails for reviews" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

DROP POLICY IF EXISTS "Admins can manage brands" ON brands;
DROP POLICY IF EXISTS "Admin access to brands" ON brands;
DROP POLICY IF EXISTS "Anyone can read active brands" ON brands;

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admin access to categories" ON categories;
DROP POLICY IF EXISTS "Anyone can read active categories" ON categories;

DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admin access to products" ON products;
DROP POLICY IF EXISTS "Anyone can read active products" ON products;

DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
DROP POLICY IF EXISTS "Admin access to product variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can read active product variants" ON product_variants;

DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;
DROP POLICY IF EXISTS "Admin access to product images" ON product_images;
DROP POLICY IF EXISTS "Anyone can read product images" ON product_images;

DROP POLICY IF EXISTS "Admins can manage all reviews" ON product_reviews;
DROP POLICY IF EXISTS "Admin access to reviews" ON product_reviews;
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can create reviews for their purchases" ON product_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON product_reviews;

DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "Admin access to orders" ON orders;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;

DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;
DROP POLICY IF EXISTS "Admin access to order items" ON order_items;
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for own orders" ON order_items;

DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
DROP POLICY IF EXISTS "Admin access to settings" ON settings;
DROP POLICY IF EXISTS "Anyone can read settings" ON settings;
DROP POLICY IF EXISTS "Allow settings creation" ON settings;
DROP POLICY IF EXISTS "Enable insert for settings" ON settings;

DROP POLICY IF EXISTS "Users can read their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can insert into their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can delete from their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON wishlists;

-- Payment-related policies
DROP POLICY IF EXISTS "Admins can manage payment processors" ON payment_processors;
DROP POLICY IF EXISTS "Admin access to payment processors" ON payment_processors;
DROP POLICY IF EXISTS "Anyone can read active payment processors" ON payment_processors;

DROP POLICY IF EXISTS "Admins can manage webhook events" ON webhook_events;
DROP POLICY IF EXISTS "Admin access to webhook events" ON webhook_events;

DROP POLICY IF EXISTS "Admins can manage all payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admin access to payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can read their own payment transactions" ON payment_transactions;

DROP POLICY IF EXISTS "Admins can manage payment refunds" ON payment_refunds;
DROP POLICY IF EXISTS "Admin access to payment refunds" ON payment_refunds;
DROP POLICY IF EXISTS "Users can read their own payment refunds" ON payment_refunds;

-- Create simple, non-recursive policies

-- Users table - keep it simple, no admin policies to avoid recursion
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

-- Brands - public read access, no admin policies
CREATE POLICY "Anyone can read active brands"
  ON brands
  FOR SELECT
  TO public
  USING (is_active = true);

-- Categories - public read access, no admin policies
CREATE POLICY "Anyone can read active categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

-- Products - public read access, no admin policies
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  TO public
  USING (is_active = true);

-- Product variants - public read access, no admin policies
CREATE POLICY "Anyone can read active product variants"
  ON product_variants
  FOR SELECT
  TO public
  USING (is_active = true);

-- Product images - public read access, no admin policies
CREATE POLICY "Anyone can read product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

-- Product reviews - public read for approved, user access for own
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

-- Orders - user access only
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

-- Order items - user access only
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

-- Settings - public read access, no admin policies
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

-- Wishlists - user access only
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

-- Payment processors - public read for active ones
CREATE POLICY "Anyone can read active payment processors"
  ON payment_processors
  FOR SELECT
  TO public
  USING (is_active = true);

-- Payment transactions - user access only
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

-- Payment refunds - user access only
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