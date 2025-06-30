/*
  # Add Customer Profiles and Inventory Tracking

  1. New Tables
    - `customer_profiles` - Stores customer profile information
    - `customer_addresses` - Stores multiple addresses per customer
    - `inventory_transactions` - Tracks inventory changes
    - `product_attributes` - Defines product attributes (size, color, etc.)
    - `product_attribute_values` - Stores values for product attributes

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users and admins
*/

-- Create customer_profiles table
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

-- Create customer_addresses table
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

-- Create inventory_transactions table
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

-- Create product_attributes table
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

-- Create product_attribute_values table
CREATE TABLE IF NOT EXISTS product_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, attribute_id)
);

-- Enable RLS on all tables
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;

-- Create policies for customer_profiles
CREATE POLICY "Users can read their own profile"
  ON customer_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON customer_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON customer_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON customer_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create policies for customer_addresses
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

-- Create policies for inventory_transactions
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

-- Create policies for product_attributes
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

-- Create policies for product_attribute_values
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(user_id, is_default);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_variant_id ON inventory_transactions(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_id, reference_type);

CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product_id ON product_attribute_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute_id ON product_attribute_values(attribute_id);

-- Create triggers for updated_at
CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
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

-- Insert sample product attributes
INSERT INTO product_attributes (name, display_name, description)
VALUES 
  ('size', 'Size', 'Product size'),
  ('color', 'Color', 'Product color'),
  ('material', 'Material', 'Product material'),
  ('weight', 'Weight', 'Product weight in grams')
ON CONFLICT (name) DO NOTHING;

-- Create function to handle inventory updates
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

-- Create trigger for inventory tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'track_product_inventory_changes'
  ) THEN
    CREATE TRIGGER track_product_inventory_changes
    AFTER UPDATE OF stock ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_inventory_update();
  END IF;
END $$;