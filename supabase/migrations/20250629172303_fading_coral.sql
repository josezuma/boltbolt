/*
  # Store Settings and Configuration

  1. New Tables
    - `settings` - Stores key-value pairs for store configuration
  
  2. Security
    - Enable RLS on settings table
    - Create policies for public read access and admin write access
  
  3. Default Values
    - Insert default store settings
*/

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Anyone can read settings') THEN
    CREATE POLICY "Anyone can read settings"
      ON settings
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admins can update settings') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admins can insert settings') THEN
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
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admins can delete settings') THEN
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
  END IF;
END $$;

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_settings_updated_at') THEN
    CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert additional default settings
INSERT INTO settings (key, value)
VALUES 
  ('analytics_enabled', 'false'::jsonb),
  ('google_analytics_id', '""'::jsonb),
  ('facebook_pixel_id', '""'::jsonb),
  ('seo_title', '"BOLTSHOP - Premium Fashion & Lifestyle"'::jsonb),
  ('seo_description', '"Discover premium fashion and lifestyle products at BOLTSHOP. Quality, style, and sustainability in every product."'::jsonb),
  ('seo_keywords', '"fashion, lifestyle, premium, sustainable, clothing"'::jsonb),
  ('inventory_tracking', 'true'::jsonb),
  ('low_stock_threshold', '5'::jsonb),
  ('email_notifications', 'true'::jsonb),
  ('order_notifications', 'true'::jsonb),
  ('customer_notifications', 'true'::jsonb),
  ('shipping_enabled', 'true'::jsonb),
  ('free_shipping_threshold', '50'::jsonb),
  ('default_shipping_rate', '9.99'::jsonb),
  ('international_shipping', 'false'::jsonb),
  ('maintenance_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;