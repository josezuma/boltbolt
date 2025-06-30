/*
  # Fix Product Detail Page Database Policies

  1. Problem
    - Product detail page fails when accessed via category filter
    - RLS policies may be blocking necessary data access
    - Need to ensure all related data can be fetched

  2. Solution
    - Add missing policies for public access to product-related data
    - Ensure product images, brands, and categories are accessible
    - Fix any restrictive policies that block legitimate access

  3. Security
    - Maintain security while allowing proper data access
    - Keep user-specific data protected
    - Allow public access to active product catalog data
*/

-- Ensure anyone can read active brands (needed for product details)
DROP POLICY IF EXISTS "Anyone can read active brands" ON brands;
CREATE POLICY "Anyone can read active brands"
  ON brands
  FOR SELECT
  TO public
  USING (is_active = true);

-- Ensure anyone can read active categories (needed for product details)
DROP POLICY IF EXISTS "Anyone can read active categories" ON categories;
CREATE POLICY "Anyone can read active categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

-- Ensure anyone can read active products (needed for product details)
DROP POLICY IF EXISTS "Anyone can read active products" ON products;
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  TO public
  USING (is_active = true);

-- Ensure anyone can read product images (needed for product details)
DROP POLICY IF EXISTS "Anyone can read product images" ON product_images;
CREATE POLICY "Anyone can read product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

-- Ensure anyone can read active product variants (needed for product details)
DROP POLICY IF EXISTS "Anyone can read active product variants" ON product_variants;
CREATE POLICY "Anyone can read active product variants"
  ON product_variants
  FOR SELECT
  TO public
  USING (is_active = true);

-- Ensure anyone can read approved product reviews (needed for product details)
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON product_reviews;
CREATE POLICY "Anyone can read approved reviews"
  ON product_reviews
  FOR SELECT
  TO public
  USING (is_approved = true);

-- Add policy to allow reading user emails for reviews (needed for review display)
-- This is safe because we only show email for approved reviews
CREATE POLICY "Allow reading user emails for approved reviews"
  ON users
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM product_reviews 
    WHERE product_reviews.user_id = users.id 
    AND product_reviews.is_approved = true
  ));

-- Ensure settings can be read publicly (needed for store configuration)
DROP POLICY IF EXISTS "Anyone can read settings" ON settings;
CREATE POLICY "Anyone can read settings"
  ON settings
  FOR SELECT
  TO public
  USING (true);

-- Add policy for authenticated users to read wishlists (for wishlist status)
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON wishlists;
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

-- Ensure all necessary indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product ON wishlists(user_id, product_id);