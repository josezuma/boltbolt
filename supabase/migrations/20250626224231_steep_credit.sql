/*
  # Seed Brands and Product Images

  1. Insert premium fashion brands
  2. Add multiple images for existing products
  3. Update products with brand associations
  4. Add sample reviews and variants
*/

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

-- Update existing products with brands and additional details
UPDATE products SET
  brand_id = (SELECT id FROM brands WHERE slug = 'atelier'),
  sku = 'ATL-OWC-001',
  material = '100% Merino Wool',
  care_instructions = 'Dry clean only. Store on padded hangers.',
  weight = 1.2,
  dimensions = '{"length": 120, "width": 60, "height": 5}',
  tags = ARRAY['premium', 'wool', 'outerwear', 'minimalist']
WHERE slug = 'oversized-wool-coat';

UPDATE products SET
  brand_id = (SELECT id FROM brands WHERE slug = 'essentials'),
  sku = 'ESS-CTN-001',
  material = '100% Cashmere',
  care_instructions = 'Hand wash in cold water. Lay flat to dry.',
  weight = 0.3,
  dimensions = '{"length": 65, "width": 50, "height": 2}',
  tags = ARRAY['luxury', 'cashmere', 'knitwear', 'essential']
WHERE slug = 'cashmere-turtleneck';

UPDATE products SET
  brand_id = (SELECT id FROM brands WHERE slug = 'heritage'),
  sku = 'HER-TWT-001',
  material = 'Wool Blend (70% Wool, 30% Polyester)',
  care_instructions = 'Machine wash cold. Hang to dry.',
  weight = 0.5,
  dimensions = '{"length": 105, "width": 45, "height": 3}',
  tags = ARRAY['tailored', 'wool', 'formal', 'classic']
WHERE slug = 'tailored-trousers';

UPDATE products SET
  brand_id = (SELECT id FROM brands WHERE slug = 'minimal'),
  sku = 'MIN-LCB-001',
  material = 'Italian Leather',
  care_instructions = 'Clean with leather conditioner. Avoid water.',
  weight = 0.4,
  dimensions = '{"length": 25, "width": 18, "height": 8}',
  tags = ARRAY['leather', 'accessories', 'handcrafted', 'italian']
WHERE slug = 'leather-crossbody-bag';

UPDATE products SET
  brand_id = (SELECT id FROM brands WHERE slug = 'studio'),
  sku = 'STU-MSN-001',
  material = 'Premium Leather Upper, Rubber Sole',
  care_instructions = 'Clean with damp cloth. Air dry.',
  weight = 0.8,
  dimensions = '{"length": 30, "width": 12, "height": 10}',
  tags = ARRAY['sneakers', 'leather', 'minimalist', 'comfortable']
WHERE slug = 'minimalist-sneakers';

-- Update newer products
UPDATE products SET
  brand_id = (SELECT id FROM brands WHERE slug = 'atelier'),
  sku = 'ATL-SMD-001',
  material = '100% Silk',
  care_instructions = 'Dry clean only. Iron on low heat.',
  weight = 0.2,
  tags = ARRAY['silk', 'dress', 'elegant', 'versatile']
WHERE slug = 'silk-midi-dress';

UPDATE products SET
  brand_id = (SELECT id FROM brands WHERE slug = 'heritage'),
  sku = 'HER-COS-001',
  material = '100% Cotton Oxford',
  care_instructions = 'Machine wash warm. Iron while damp.',
  weight = 0.3,
  tags = ARRAY['cotton', 'shirt', 'classic', 'versatile']
WHERE slug = 'cotton-oxford-shirt';

UPDATE products SET
  brand_id = (SELECT id FROM brands WHERE slug = 'studio'),
  sku = 'STU-RDJ-001',
  material = '100% Cotton Denim (14oz)',
  care_instructions = 'Machine wash cold. Hang to dry.',
  weight = 0.7,
  tags = ARRAY['denim', 'raw', 'japanese', 'premium']
WHERE slug = 'raw-denim-jeans';

UPDATE products SET
  brand_id = (SELECT id FROM brands WHERE slug = 'heritage'),
  sku = 'HER-LCB-001',
  material = 'Italian Leather Upper, Leather Sole',
  care_instructions = 'Polish regularly. Use cedar shoe trees.',
  weight = 1.0,
  tags = ARRAY['boots', 'leather', 'handcrafted', 'chelsea']
WHERE slug = 'leather-chelsea-boots';

-- Add multiple images for products
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
((SELECT id FROM products WHERE slug = 'leather-chelsea-boots'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800', 'Leather chelsea boots front view', 2, false);

-- Update products to reference their featured images
UPDATE products SET featured_image_id = (
  SELECT id FROM product_images 
  WHERE product_images.product_id = products.id 
  AND is_featured = true 
  LIMIT 1
);

-- Add some sample product variants (sizes for clothing)
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
((SELECT id FROM products WHERE slug = 'minimalist-sneakers'), 'Size 11', 'STU-MSN-001-11', 145.00, 1, '{"size": "11"}', true);

-- Add some sample reviews
INSERT INTO product_reviews (product_id, user_id, rating, title, comment, is_verified_purchase, is_approved) VALUES
((SELECT id FROM products WHERE slug = 'cashmere-turtleneck'), (SELECT id FROM users WHERE email = 'admin@example.com'), 5, 'Incredibly Soft', 'The quality of this cashmere is exceptional. Worth every penny.', true, true),
((SELECT id FROM products WHERE slug = 'minimalist-sneakers'), (SELECT id FROM users WHERE email = 'admin@example.com'), 4, 'Great Design', 'Love the minimalist aesthetic. Very comfortable for daily wear.', true, true),
((SELECT id FROM products WHERE slug = 'leather-crossbody-bag'), (SELECT id FROM users WHERE email = 'admin@example.com'), 5, 'Perfect Size', 'Exactly what I was looking for. The leather quality is outstanding.', true, true);