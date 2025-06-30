/*
  # Store Settings Table

  1. New Tables
    - `settings` - Key-value store for application settings
      - `key` (text, primary key)
      - `value` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `settings` table
    - Add policies for public read access
    - Add policies for admin write access
    
  3. Initial Data
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

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Allow settings creation') THEN
    CREATE POLICY "Allow settings creation"
      ON settings
      FOR INSERT
      TO public
      WITH CHECK (true);
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

-- Insert default settings
INSERT INTO settings (key, value)
VALUES 
  ('store_name', '"BOLTSHOP"'::jsonb),
  ('store_description', '"Premium fashion and lifestyle products"'::jsonb),
  ('store_email', '"contact@boltshop.com"'::jsonb),
  ('store_phone', '"+1 (555) 123-4567"'::jsonb),
  ('store_address', '{"street": "123 Fashion Avenue", "city": "New York", "state": "NY", "zip": "10001", "country": "US"}'::jsonb),
  ('currency', '"USD"'::jsonb),
  ('tax_rate', '0.08'::jsonb),
  ('free_shipping_threshold', '50'::jsonb),
  ('store_logo', '""'::jsonb),
  ('store_primary_color', '"#2A2A2A"'::jsonb),
  ('store_secondary_color', '"#EAEAEA"'::jsonb),
  ('onboarding_completed', 'false'::jsonb),
  ('setup_step', '0'::jsonb)
ON CONFLICT (key) DO NOTHING;