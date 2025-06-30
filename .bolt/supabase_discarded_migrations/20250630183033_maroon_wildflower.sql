-- BoltShop E-commerce Platform Seed Data
-- This file contains sample data to populate the BoltShop database with realistic content.
-- It includes categories, brands, products, and other essential data for testing and development.

-- ============================================================================
-- CATEGORIES
-- ============================================================================

-- Insert fashion categories
INSERT INTO categories (name, slug, description, image_url, is_active) VALUES
('Women''s', 'womens', 'Contemporary women''s fashion featuring premium fabrics and modern silhouettes', 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800', true),
('Men''s', 'mens', 'Refined men''s essentials crafted for the modern gentleman', 'https://images.pexels.com/photos/5886041/pexels-photo-5886041.jpeg?auto=compress&cs=tinysrgb&w=800', true),
('Outerwear', 'outerwear', 'Premium outerwear collection for every season and occasion', 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800', true),
('Accessories', 'accessories', 'Curated accessories to complete your look', 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800', true),
('Footwear', 'footwear', 'Premium footwear collection from casual to formal', 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800', true),
('Denim', 'denim', 'Premium denim collection featuring contemporary cuts and washes', 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ============================================================================
-- BRANDS
-- ============================================================================

-- Insert premium fashion brands
INSERT INTO brands (name, slug, description, logo_url, website_url, is_active) VALUES
('ESSENTIALS', 'essentials', 'Minimalist essentials for the modern wardrobe. Clean lines, premium materials, timeless design.', 'https://images.pexels.com/photos/6069112/pexels-photo-6069112.jpeg?auto=compress&cs=tinysrgb&w=200', 'https://essentials.com', true),
('ATELIER', 'atelier', 'Contemporary luxury fashion with artisanal craftsmanship. Each piece tells a story of meticulous attention to detail.', 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=200', 'https://atelier.com', true),
('STUDIO', 'studio', 'Innovative designs that blur the line between fashion and art. For those who dare to be different.', 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=200', 'https://studio.com', true),
('HERITAGE', 'heritage', 'Classic designs with a modern twist. Celebrating traditional craftsmanship with contemporary sensibilities.', 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=200', 'https://heritage.com', true),
('MINIMAL', 'minimal', 'Less is more. Refined simplicity for the conscious consumer. Sustainable luxury at its finest.', 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=200', 'https://minimal.com', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  website_url = EXCLUDED.website_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ============================================================================
-- PRODUCTS
-- ============================================================================

-- Insert products
INSERT INTO products (
  name, 
  slug, 
  description, 
  price, 
  stock, 
  category_id, 
  brand_id, 
  sku, 
  material, 
  care_instructions, 
  weight, 
  dimensions, 
  tags, 
  is_active
) VALUES 
(
  'Oversized Wool Coat',
  'oversized-wool-coat',
  'A premium oversized wool coat crafted from 100% merino wool. Features a minimalist design with clean lines and a relaxed fit. Perfect for layering during colder months.',
  285.00,
  12,
  (SELECT id FROM categories WHERE slug = 'outerwear'),
  (SELECT id FROM brands WHERE slug = 'atelier'),
  'ATL-OWC-001',
  '100% Merino Wool',
  'Dry clean only. Store on padded hangers.',
  1.2,
  '{"length": 120, "width": 60, "height": 5}',
  ARRAY['premium', 'wool', 'outerwear', 'minimalist'],
  true
),
(
  'Cashmere Turtleneck Sweater',
  'cashmere-turtleneck',
  'Luxurious cashmere turtleneck sweater in a classic fit. Made from the finest cashmere fibers for ultimate softness and warmth. Available in neutral tones.',
  195.00,
  8,
  (SELECT id FROM categories WHERE slug = 'womens'),
  (SELECT id FROM brands WHERE slug = 'essentials'),
  'ESS-CTN-001',
  '100% Cashmere',
  'Hand wash in cold water. Lay flat to dry.',
  0.3,
  '{"length": 65, "width": 50, "height": 2}',
  ARRAY['luxury', 'cashmere', 'knitwear', 'essential'],
  true
),
(
  'Tailored Wool Trousers',
  'tailored-trousers',
  'Contemporary tailored trousers with a modern cut. Crafted from premium wool blend fabric with a comfortable mid-rise fit. Perfect for both casual and formal occasions.',
  165.00,
  15,
  (SELECT id FROM categories WHERE slug = 'mens'),
  (SELECT id FROM brands WHERE slug = 'heritage'),
  'HER-TWT-001',
  'Wool Blend (70% Wool, 30% Polyester)',
  'Machine wash cold. Hang to dry.',
  0.5,
  '{"length": 105, "width": 45, "height": 3}',
  ARRAY['tailored', 'wool', 'formal', 'classic'],
  true
),
(
  'Leather Crossbody Bag',
  'leather-crossbody-bag',
  'Minimalist leather crossbody bag handcrafted from premium Italian leather. Features an adjustable strap and multiple compartments for organization.',
  125.00,
  6,
  (SELECT id FROM categories WHERE slug = 'accessories'),
  (SELECT id FROM brands WHERE slug = 'minimal'),
  'MIN-LCB-001',
  'Italian Leather',
  'Clean with leather conditioner. Avoid water.',
  0.4,
  '{"length": 25, "width": 18, "height": 8}',
  ARRAY['leather', 'accessories', 'handcrafted', 'italian'],
  true
),
(
  'Minimalist Sneakers',
  'minimalist-sneakers',
  'Clean, minimalist sneakers crafted from premium leather with a comfortable rubber sole. Features a timeless design that pairs well with any outfit.',
  145.00,
  10,
  (SELECT id FROM categories WHERE slug = 'footwear'),
  (SELECT id FROM brands WHERE slug = 'studio'),
  'STU-MSN-001',
  'Premium Leather Upper, Rubber Sole',
  'Clean with damp cloth. Air dry.',
  0.8,
  '{"length": 30, "width": 12, "height": 10}',
  ARRAY['sneakers', 'leather', 'minimalist', 'comfortable'],
  true
),
(
  'Silk Midi Dress',
  'silk-midi-dress',
  'Elegant silk midi dress with a timeless silhouette. Features a flattering A-line cut and delicate button details. Perfect for both day and evening wear.',
  245.00,
  7,
  (SELECT id FROM categories WHERE slug = 'womens'),
  (SELECT id FROM brands WHERE slug = 'atelier'),
  'ATL-SMD-001',
  '100% Silk',
  'Dry clean only. Iron on low heat.',
  0.2,
  '{"length": 110, "width": 40, "height": 1}',
  ARRAY['silk', 'dress', 'elegant', 'versatile'],
  true
),
(
  'Cotton Oxford Shirt',
  'cotton-oxford-shirt',
  'Classic cotton oxford shirt in a modern fit. Made from premium cotton with mother-of-pearl buttons. A versatile piece that works from office to weekend.',
  125.00,
  14,
  (SELECT id FROM categories WHERE slug = 'mens'),
  (SELECT id FROM brands WHERE slug = 'heritage'),
  'HER-COS-001',
  '100% Cotton Oxford',
  'Machine wash warm. Iron while damp.',
  0.3,
  '{"length": 75, "width": 60, "height": 1}',
  ARRAY['cotton', 'shirt', 'classic', 'versatile'],
  true
),
(
  'Raw Denim Jeans',
  'raw-denim-jeans',
  'Premium raw denim jeans with a classic straight cut. Made from 100% cotton denim that will develop a unique patina over time. Crafted in Japan.',
  185.00,
  9,
  (SELECT id FROM categories WHERE slug = 'denim'),
  (SELECT id FROM brands WHERE slug = 'studio'),
  'STU-RDJ-001',
  '100% Cotton Denim (14oz)',
  'Machine wash cold. Hang to dry.',
  0.7,
  '{"length": 105, "width": 35, "height": 2}',
  ARRAY['denim', 'raw', 'japanese', 'premium'],
  true
),
(
  'Leather Chelsea Boots',
  'leather-chelsea-boots',
  'Handcrafted leather Chelsea boots with elastic side panels. Made from premium Italian leather with a comfortable rubber sole. A timeless style for any wardrobe.',
  295.00,
  5,
  (SELECT id FROM categories WHERE slug = 'footwear'),
  (SELECT id FROM brands WHERE slug = 'heritage'),
  'HER-LCB-001',
  'Italian Leather Upper, Leather Sole',
  'Polish regularly. Use cedar shoe trees.',
  1.0,
  '{"length": 32, "width": 12, "height": 15}',
  ARRAY['boots', 'leather', 'handcrafted', 'chelsea'],
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  sku = EXCLUDED.sku,
  material = EXCLUDED.material,
  care_instructions = EXCLUDED.care_instructions,
  weight = EXCLUDED.weight,
  dimensions = EXCLUDED.dimensions,
  tags = EXCLUDED.tags,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ============================================================================
-- PRODUCT IMAGES
-- ============================================================================

-- Insert product images
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_featured) VALUES
-- Oversized Wool Coat
((SELECT id FROM products WHERE slug = 'oversized-wool-coat'), 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800', 'Oversized wool coat front view', 1, true),
((SELECT id FROM products WHERE slug = 'oversized-wool-coat'), 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800', 'Oversized wool coat back view', 2, false),
((SELECT id FROM products WHERE slug = 'oversized-wool-coat'), 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800', 'Oversized wool coat detail', 3, false),

-- Cashmere Turtleneck
((SELECT id FROM products WHERE slug = 'cashmere-turtleneck'), 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800', 'Cashmere turtleneck front view', 1, true),
((SELECT id FROM products WHERE slug = 'cashmere-turtleneck'), 'https://images.pexels.com/photos/5698849/pexels-photo-5698849.jpeg?auto=compress&cs=tinysrgb&w=800', 'Cashmere turtleneck side view', 2, false),
((SELECT id FROM products WHERE slug = 'cashmere-turtleneck'), 'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=800', 'Cashmere turtleneck texture detail', 3, false),

-- Tailored Trousers
((SELECT id FROM products WHERE slug = 'tailored-trousers'), 'https://images.pexels.com/photos/5886041/pexels-photo-5886041.jpeg?auto=compress&cs=tinysrgb&w=800', 'Tailored trousers front view', 1, true),
((SELECT id FROM products WHERE slug = 'tailored-trousers'), 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800', 'Tailored trousers side view', 2, false),

-- Leather Crossbody Bag
((SELECT id FROM products WHERE slug = 'leather-crossbody-bag'), 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800', 'Leather crossbody bag main view', 1, true),
((SELECT id FROM products WHERE slug = 'leather-crossbody-bag'), 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=800', 'Leather crossbody bag interior', 2, false),
((SELECT id FROM products WHERE slug = 'leather-crossbody-bag'), 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=800', 'Leather crossbody bag detail', 3, false),

-- Minimalist Sneakers
((SELECT id FROM products WHERE slug = 'minimalist-sneakers'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800', 'Minimalist sneakers side view', 1, true),
((SELECT id FROM products WHERE slug = 'minimalist-sneakers'), 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=800', 'Minimalist sneakers top view', 2, false),

-- Silk Midi Dress
((SELECT id FROM products WHERE slug = 'silk-midi-dress'), 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800', 'Silk midi dress front view', 1, true),
((SELECT id FROM products WHERE slug = 'silk-midi-dress'), 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800', 'Silk midi dress back view', 2, false),

-- Cotton Oxford Shirt
((SELECT id FROM products WHERE slug = 'cotton-oxford-shirt'), 'https://images.pexels.com/photos/2897883/pexels-photo-2897883.jpeg?auto=compress&cs=tinysrgb&w=800', 'Cotton oxford shirt front view', 1, true),
((SELECT id FROM products WHERE slug = 'cotton-oxford-shirt'), 'https://images.pexels.com/photos/5886041/pexels-photo-5886041.jpeg?auto=compress&cs=tinysrgb&w=800', 'Cotton oxford shirt detail', 2, false),

-- Raw Denim Jeans
((SELECT id FROM products WHERE slug = 'raw-denim-jeans'), 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800', 'Raw denim jeans front view', 1, true),
((SELECT id FROM products WHERE slug = 'raw-denim-jeans'), 'https://images.pexels.com/photos/5886041/pexels-photo-5886041.jpeg?auto=compress&cs=tinysrgb&w=800', 'Raw denim jeans back view', 2, false),

-- Leather Chelsea Boots
((SELECT id FROM products WHERE slug = 'leather-chelsea-boots'), 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=800', 'Leather chelsea boots side view', 1, true),
((SELECT id FROM products WHERE slug = 'leather-chelsea-boots'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800', 'Leather chelsea boots front view', 2, false)
ON CONFLICT DO NOTHING;

-- Update products to reference their featured images
UPDATE products SET featured_image_id = (
  SELECT id FROM product_images 
  WHERE product_images.product_id = products.id 
  AND is_featured = true 
  LIMIT 1
);

-- Update products to set image_url from featured image
UPDATE products SET image_url = (
  SELECT image_url FROM product_images
  WHERE product_images.product_id = products.id
  AND is_featured = true
  LIMIT 1
)
WHERE image_url IS NULL;

-- ============================================================================
-- PRODUCT VARIANTS
-- ============================================================================

-- Insert product variants
INSERT INTO product_variants (product_id, name, sku, price, stock, attributes, is_active) VALUES
-- Cashmere Turtleneck sizes
((SELECT id FROM products WHERE slug = 'cashmere-turtleneck'), 'Small', 'ESS-CTN-001-S', 195.00, 3, '{"size": "S"}', true),
((SELECT id FROM products WHERE slug = 'cashmere-turtleneck'), 'Medium', 'ESS-CTN-001-M', 195.00, 3, '{"size": "M"}', true),
((SELECT id FROM products WHERE slug = 'cashmere-turtleneck'), 'Large', 'ESS-CTN-001-L', 195.00, 2, '{"size": "L"}', true),

-- Tailored Trousers sizes
((SELECT id FROM products WHERE slug = 'tailored-trousers'), 'Size 30', 'HER-TWT-001-30', 165.00, 5, '{"waist": "30"}', true),
((SELECT id FROM products WHERE slug = 'tailored-trousers'), 'Size 32', 'HER-TWT-001-32', 165.00, 5, '{"waist": "32"}', true),
((SELECT id FROM products WHERE slug = 'tailored-trousers'), 'Size 34', 'HER-TWT-001-34', 165.00, 5, '{"waist": "34"}', true),

-- Minimalist Sneakers sizes
((SELECT id FROM products WHERE slug = 'minimalist-sneakers'), 'Size 8', 'STU-MSN-001-8', 145.00, 2, '{"size": "8"}', true),
((SELECT id FROM products WHERE slug = 'minimalist-sneakers'), 'Size 9', 'STU-MSN-001-9', 145.00, 4, '{"size": "9"}', true),
((SELECT id FROM products WHERE slug = 'minimalist-sneakers'), 'Size 10', 'STU-MSN-001-10', 145.00, 3, '{"size": "10"}', true),
((SELECT id FROM products WHERE slug = 'minimalist-sneakers'), 'Size 11', 'STU-MSN-001-11', 145.00, 1, '{"size": "11"}', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DISCOUNTS
-- ============================================================================

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

-- ============================================================================
-- DEMO USER
-- ============================================================================

-- Create a demo admin user (will only be created if no users exist)
-- Note: This is just for demonstration purposes. In a real environment,
-- you would create users through the auth API, not direct database insertion.
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  IF user_count = 0 THEN
    -- Insert a demo admin user with email admin@example.com and password 'password123'
    -- The password hash is just a placeholder and won't actually work for authentication
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'admin@example.com',
      '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789',
      now(),
      now(),
      now()
    );
  END IF;
END $$;