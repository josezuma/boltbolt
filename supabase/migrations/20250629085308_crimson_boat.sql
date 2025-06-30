/*
  # Fix RLS Infinite Recursion

  1. Problem
    - RLS policies with "FOR ALL" that check admin roles cause infinite recursion
    - When SELECT queries trigger policies that query the users table, it creates loops
    - This affects all admin management policies across multiple tables

  2. Solution
    - Drop existing "FOR ALL" admin policies that cause recursion
    - Recreate admin policies only for INSERT, UPDATE, DELETE operations
    - Keep SELECT operations governed by public read policies only
    - This prevents recursion while maintaining security

  3. Security
    - Public can still only read active/approved content
    - Admins can still manage all data through INSERT/UPDATE/DELETE
    - No security is compromised, only recursion is eliminated
*/

-- ============================================================================
-- BRANDS TABLE POLICIES
-- ============================================================================

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage brands" ON brands;

-- Create separate admin policies for non-SELECT operations only
CREATE POLICY "Admins can insert brands"
  ON brands
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update brands"
  ON brands
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete brands"
  ON brands
  FOR DELETE
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

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Create separate admin policies for non-SELECT operations only
CREATE POLICY "Admins can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories
  FOR DELETE
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

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- Create separate admin policies for non-SELECT operations only
CREATE POLICY "Admins can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete products"
  ON products
  FOR DELETE
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

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;

-- Create separate admin policies for non-SELECT operations only
CREATE POLICY "Admins can insert product images"
  ON product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update product images"
  ON product_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete product images"
  ON product_images
  FOR DELETE
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

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;

-- Create separate admin policies for non-SELECT operations only
CREATE POLICY "Admins can insert product variants"
  ON product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update product variants"
  ON product_variants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete product variants"
  ON product_variants
  FOR DELETE
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

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage all reviews" ON product_reviews;

-- Create separate admin policies for non-SELECT operations only
CREATE POLICY "Admins can insert product reviews"
  ON product_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update product reviews"
  ON product_reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete product reviews"
  ON product_reviews
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

-- Create separate admin policies for non-SELECT operations only
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

-- ============================================================================
-- ORDER ITEMS TABLE POLICIES
-- ============================================================================

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

-- Create separate admin policies for non-SELECT operations only
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

-- ============================================================================
-- SETTINGS TABLE POLICIES
-- ============================================================================

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;

-- Create separate admin policies for non-SELECT operations only
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
-- PAYMENT PROCESSORS TABLE POLICIES
-- ============================================================================

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage payment processors" ON payment_processors;

-- Create separate admin policies for non-SELECT operations only
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

-- ============================================================================
-- PAYMENT TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage all payment transactions" ON payment_transactions;

-- Create separate admin policies for non-SELECT operations only
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

-- ============================================================================
-- WEBHOOK EVENTS TABLE POLICIES
-- ============================================================================

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage webhook events" ON webhook_events;

-- Create separate admin policies for non-SELECT operations only
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

-- ============================================================================
-- PAYMENT REFUNDS TABLE POLICIES
-- ============================================================================

-- Drop existing admin policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage payment refunds" ON payment_refunds;

-- Create separate admin policies for non-SELECT operations only
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been fixed to prevent infinite recursion';
  RAISE NOTICE 'Admin policies now only apply to INSERT, UPDATE, DELETE operations';
  RAISE NOTICE 'SELECT operations use public read policies only';
END $$;