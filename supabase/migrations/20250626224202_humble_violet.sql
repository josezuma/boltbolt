/*
  # Enhanced eCommerce Database Schema

  1. New Tables
    - `brands` - Store brand information
    - `product_images` - Multiple images per product
    - `product_variants` - Size, color variants (future-ready)
    - `product_reviews` - Customer reviews
    - `wishlists` - User wishlists

  2. Updates
    - Add brand_id to products table
    - Add featured_image_id to products table
    - Enhanced product attributes

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

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

-- Create product_images table for multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  sort_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create product_variants table (for future use - sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g., "Small", "Red", "Small/Red"
  sku text UNIQUE,
  price numeric(10,2),
  stock integer DEFAULT 0,
  attributes jsonb, -- {"size": "S", "color": "red"}
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Add brand_id to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE products ADD COLUMN brand_id uuid REFERENCES brands(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add featured_image_id to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'featured_image_id'
  ) THEN
    ALTER TABLE products ADD COLUMN featured_image_id uuid REFERENCES product_images(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add additional product fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sku'
  ) THEN
    ALTER TABLE products ADD COLUMN sku text UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'weight'
  ) THEN
    ALTER TABLE products ADD COLUMN weight numeric(8,2); -- in kg
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'dimensions'
  ) THEN
    ALTER TABLE products ADD COLUMN dimensions jsonb; -- {"length": 10, "width": 5, "height": 2}
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'tags'
  ) THEN
    ALTER TABLE products ADD COLUMN tags text[]; -- ["sustainable", "organic", "limited-edition"]
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'material'
  ) THEN
    ALTER TABLE products ADD COLUMN material text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'care_instructions'
  ) THEN
    ALTER TABLE products ADD COLUMN care_instructions text;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies for brands
CREATE POLICY "Anyone can read active brands"
  ON brands
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage brands"
  ON brands
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create policies for product_images
CREATE POLICY "Anyone can read product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage product images"
  ON product_images
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create policies for product_variants
CREATE POLICY "Anyone can read active product variants"
  ON product_variants
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage product variants"
  ON product_variants
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create policies for product_reviews
CREATE POLICY "Anyone can read approved reviews"
  ON product_reviews
  FOR SELECT
  TO public
  USING (is_approved = true);

CREATE POLICY "Users can create reviews for their purchases"
  ON product_reviews
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON product_reviews
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
  ON product_reviews
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create policies for wishlists
CREATE POLICY "Users can manage their own wishlists"
  ON wishlists
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_featured ON product_images(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(product_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
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