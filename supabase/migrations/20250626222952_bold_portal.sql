/*
  # Seed Data Migration

  1. Categories
    - Clothing: Premium clothing collection
    - Accessories: Curated accessories
    - Footwear: Premium footwear collection

  2. Products
    - 5 fashion items across different categories
    - Premium pricing and descriptions
    - High-quality product images

  3. Store Settings
    - Basic store configuration
    - Shipping and tax settings
    - Contact information and social media

  Note: Uses ON CONFLICT to handle existing data gracefully
*/

-- Insert Categories (handle duplicates)
INSERT INTO categories (name, slug, description, image_url, is_active) VALUES
('Clothing', 'clothing', 'Premium clothing collection featuring contemporary designs and quality fabrics', 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800', true),
('Accessories', 'accessories', 'Curated accessories to complement your style', 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800', true),
('Footwear', 'footwear', 'Premium footwear collection for every occasion', 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Insert Products (handle duplicates)
INSERT INTO products (name, slug, description, price, stock, image_url, category_id, is_active) VALUES
(
  'Oversized Wool Coat',
  'oversized-wool-coat',
  'A premium oversized wool coat crafted from 100% merino wool. Features a minimalist design with clean lines and a relaxed fit. Perfect for layering during colder months.',
  285.00,
  12,
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800',
  (SELECT id FROM categories WHERE slug = 'clothing'),
  true
),
(
  'Cashmere Turtleneck',
  'cashmere-turtleneck',
  'Luxurious cashmere turtleneck sweater in a classic fit. Made from the finest cashmere fibers for ultimate softness and warmth. Available in neutral tones.',
  195.00,
  8,
  'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800',
  (SELECT id FROM categories WHERE slug = 'clothing'),
  true
),
(
  'Tailored Trousers',
  'tailored-trousers',
  'Contemporary tailored trousers with a modern cut. Crafted from premium wool blend fabric with a comfortable mid-rise fit. Perfect for both casual and formal occasions.',
  165.00,
  15,
  'https://images.pexels.com/photos/5886041/pexels-photo-5886041.jpeg?auto=compress&cs=tinysrgb&w=800',
  (SELECT id FROM categories WHERE slug = 'clothing'),
  true
),
(
  'Leather Crossbody Bag',
  'leather-crossbody-bag',
  'Minimalist leather crossbody bag handcrafted from premium Italian leather. Features an adjustable strap and multiple compartments for organization.',
  125.00,
  6,
  'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800',
  (SELECT id FROM categories WHERE slug = 'accessories'),
  true
),
(
  'Minimalist Sneakers',
  'minimalist-sneakers',
  'Clean, minimalist sneakers crafted from premium leather with a comfortable rubber sole. Features a timeless design that pairs well with any outfit.',
  145.00,
  10,
  'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
  (SELECT id FROM categories WHERE slug = 'footwear'),
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  image_url = EXCLUDED.image_url,
  category_id = EXCLUDED.category_id,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Insert Store Settings (handle duplicates)
INSERT INTO settings (key, value) VALUES
('store_name', '"BOLTSHOP"'),
('store_description', '"Premium fashion and lifestyle products for the modern individual"'),
('store_email', '"hello@boltshop.com"'),
('store_phone', '"+1 (555) 123-4567"'),
('shipping_free_threshold', '150'),
('tax_rate', '0.08'),
('currency', '"USD"'),
('store_address', '{"street": "123 Fashion Ave", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}'),
('social_media', '{"instagram": "@boltshop", "twitter": "@boltshop", "facebook": "boltshop"}'),
('store_hours', '{"monday": "9:00 AM - 8:00 PM", "tuesday": "9:00 AM - 8:00 PM", "wednesday": "9:00 AM - 8:00 PM", "thursday": "9:00 AM - 8:00 PM", "friday": "9:00 AM - 9:00 PM", "saturday": "10:00 AM - 9:00 PM", "sunday": "11:00 AM - 7:00 PM"}')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();