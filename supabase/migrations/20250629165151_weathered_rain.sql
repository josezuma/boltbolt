/*
  # Discount System Implementation

  1. New Tables
    - `discounts` - Stores discount information including type, value, and validity period
    - `discount_redemptions` - Tracks usage of discounts by users
    - `discount_products` - Links discounts to specific products
    - `discount_categories` - Links discounts to product categories
  
  2. Schema Changes
    - Adds `discount_id` and `discount_amount` columns to the `orders` table
  
  3. Security
    - Enables RLS on all new tables
    - Adds appropriate policies for each table
*/

-- Create discount_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
        CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');
    END IF;
END $$;

-- Create discounts table
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

-- Create discount_redemptions table to track usage
CREATE TABLE IF NOT EXISTS discount_redemptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id uuid REFERENCES discounts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    amount_discounted numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create discount_products table for product-specific discounts
CREATE TABLE IF NOT EXISTS discount_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id uuid REFERENCES discounts(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'discount_products_discount_id_product_id_key'
    ) THEN
        ALTER TABLE discount_products 
        ADD CONSTRAINT discount_products_discount_id_product_id_key 
        UNIQUE (discount_id, product_id);
    END IF;
END $$;

-- Create discount_categories table for category-specific discounts
CREATE TABLE IF NOT EXISTS discount_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id uuid REFERENCES discounts(id) ON DELETE CASCADE,
    category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'discount_categories_discount_id_category_id_key'
    ) THEN
        ALTER TABLE discount_categories 
        ADD CONSTRAINT discount_categories_discount_id_category_id_key 
        UNIQUE (discount_id, category_id);
    END IF;
END $$;

-- Add discount_id to orders table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'discount_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN discount_id uuid REFERENCES discounts(id) ON DELETE SET NULL;
        ALTER TABLE orders ADD COLUMN discount_amount numeric(10,2) DEFAULT 0;
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can read active discounts" ON discounts;
DROP POLICY IF EXISTS "Admins can insert discounts" ON discounts;
DROP POLICY IF EXISTS "Admins can update discounts" ON discounts;
DROP POLICY IF EXISTS "Admins can delete discounts" ON discounts;

DROP POLICY IF EXISTS "Users can read their own discount redemptions" ON discount_redemptions;
DROP POLICY IF EXISTS "Admins can select all discount redemptions" ON discount_redemptions;
DROP POLICY IF EXISTS "Users can insert their own discount redemptions" ON discount_redemptions;
DROP POLICY IF EXISTS "Admins can insert discount redemptions" ON discount_redemptions;

DROP POLICY IF EXISTS "Public can read discount products" ON discount_products;
DROP POLICY IF EXISTS "Admins can manage discount products" ON discount_products;

DROP POLICY IF EXISTS "Public can read discount categories" ON discount_categories;
DROP POLICY IF EXISTS "Admins can manage discount categories" ON discount_categories;

-- Create policies for discounts
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

-- Create policies for discount_redemptions
CREATE POLICY "Users can read their own discount redemptions"
  ON discount_redemptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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

CREATE POLICY "Users can insert their own discount redemptions"
  ON discount_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

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

-- Create policies for discount_products
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

-- Create policies for discount_categories
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_discounts_automatic ON discounts(is_automatic);
CREATE INDEX IF NOT EXISTS idx_discounts_dates ON discounts(starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_discount_redemptions_discount_id ON discount_redemptions(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_user_id ON discount_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_order_id ON discount_redemptions(order_id);

CREATE INDEX IF NOT EXISTS idx_discount_products_discount_id ON discount_products(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_products_product_id ON discount_products(product_id);

CREATE INDEX IF NOT EXISTS idx_discount_categories_discount_id ON discount_categories(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_categories_category_id ON discount_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_orders_discount_id ON orders(discount_id);

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_discounts_updated_at'
    ) THEN
        CREATE TRIGGER update_discounts_updated_at
        BEFORE UPDATE ON discounts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample discounts
INSERT INTO discounts (
  name, 
  description, 
  code, 
  discount_type, 
  discount_value, 
  is_active, 
  is_automatic,
  minimum_purchase_amount,
  usage_limit,
  starts_at,
  ends_at
) VALUES 
(
  'Summer Sale 20% Off',
  'Get 20% off your entire purchase during our summer sale',
  'SUMMER20',
  'percentage',
  20.00,
  true,
  false,
  0,
  NULL,
  now(),
  now() + interval '30 days'
),
(
  'Welcome $10 Off',
  'Get $10 off your first purchase',
  'WELCOME10',
  'fixed_amount',
  10.00,
  true,
  false,
  50.00,
  1,
  now(),
  now() + interval '90 days'
),
(
  'Free Shipping',
  'Free shipping on all orders over $100',
  'FREESHIP',
  'fixed_amount',
  9.99,
  true,
  false,
  100.00,
  NULL,
  now(),
  now() + interval '60 days'
),
(
  'Automatic 5% Discount',
  'Automatic 5% discount on all orders',
  NULL,
  'percentage',
  5.00,
  true,
  true,
  0,
  NULL,
  now(),
  NULL
)
ON CONFLICT (code) DO NOTHING;