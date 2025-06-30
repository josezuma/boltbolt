/*
  # Add Promo Banner Setting

  1. New Settings
    - Adds a default promo banner configuration to the settings table
*/

-- Insert promo banner setting if it doesn't exist
INSERT INTO settings (key, value)
VALUES (
  'promo_banner', 
  '{"text": "Free shipping on all orders over $50", "link": "/products", "enabled": true}'::jsonb
)
ON CONFLICT (key) DO NOTHING;