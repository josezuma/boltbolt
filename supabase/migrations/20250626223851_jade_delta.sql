/*
  # Update clothing categories

  1. Categories Update
    - Replace generic categories with specific clothing categories
    - Add more fashion-focused categories like Women's, Men's, Outerwear
    - Update existing products to match new categories
  
  2. Products Update
    - Update product categories to match new structure
    - Ensure all products have appropriate category assignments
*/

-- First, let's update the existing categories to be more clothing-specific
UPDATE categories SET
  name = 'Women''s',
  slug = 'womens',
  description = 'Contemporary women''s fashion featuring premium fabrics and modern silhouettes',
  image_url = 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE slug = 'clothing';

UPDATE categories SET
  name = 'Men''s',
  slug = 'mens',
  description = 'Refined men''s essentials crafted for the modern gentleman',
  image_url = 'https://images.pexels.com/photos/5886041/pexels-photo-5886041.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE slug = 'accessories';

UPDATE categories SET
  name = 'Outerwear',
  slug = 'outerwear',
  description = 'Premium outerwear collection for every season and occasion',
  image_url = 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800'
WHERE slug = 'footwear';

-- Add additional clothing-specific categories
INSERT INTO categories (name, slug, description, image_url, is_active) VALUES
('Accessories', 'accessories', 'Curated accessories to complete your look', 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800', true),
('Footwear', 'footwear', 'Premium footwear collection from casual to formal', 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800', true),
('Denim', 'denim', 'Premium denim collection featuring contemporary cuts and washes', 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800', true)
ON CONFLICT (slug) DO NOTHING;

-- Update existing products to match new category structure
UPDATE products SET
  category_id = (SELECT id FROM categories WHERE slug = 'womens'),
  name = 'Cashmere Turtleneck Sweater',
  description = 'Luxurious cashmere turtleneck in a relaxed fit. Crafted from the finest cashmere fibers for ultimate softness and warmth. A timeless piece for your wardrobe.'
WHERE slug = 'cashmere-turtleneck';

UPDATE products SET
  category_id = (SELECT id FROM categories WHERE slug = 'mens'),
  name = 'Tailored Wool Trousers',
  description = 'Contemporary tailored trousers with a modern cut. Crafted from premium wool blend fabric with a comfortable mid-rise fit. Perfect for both casual and formal occasions.'
WHERE slug = 'tailored-trousers';

UPDATE products SET
  category_id = (SELECT id FROM categories WHERE slug = 'outerwear'),
  name = 'Oversized Wool Coat',
  description = 'A premium oversized wool coat crafted from 100% merino wool. Features a minimalist design with clean lines and a relaxed fit. Perfect for layering during colder months.'
WHERE slug = 'oversized-wool-coat';

UPDATE products SET
  category_id = (SELECT id FROM categories WHERE slug = 'accessories')
WHERE slug = 'leather-crossbody-bag';

UPDATE products SET
  category_id = (SELECT id FROM categories WHERE slug = 'footwear')
WHERE slug = 'minimalist-sneakers';

-- Add some additional clothing products to populate the new categories
INSERT INTO products (name, slug, description, price, stock, image_url, category_id, is_active) VALUES
(
  'Silk Midi Dress',
  'silk-midi-dress',
  'Elegant silk midi dress with a timeless silhouette. Features a flattering A-line cut and delicate button details. Perfect for both day and evening wear.',
  245.00,
  7,
  'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800',
  (SELECT id FROM categories WHERE slug = 'womens'),
  true
),
(
  'Cotton Oxford Shirt',
  'cotton-oxford-shirt',
  'Classic cotton oxford shirt in a modern fit. Made from premium cotton with mother-of-pearl buttons. A versatile piece that works from office to weekend.',
  125.00,
  14,
  'https://images.pexels.com/photos/2897883/pexels-photo-2897883.jpeg?auto=compress&cs=tinysrgb&w=800',
  (SELECT id FROM categories WHERE slug = 'mens'),
  true
),
(
  'Raw Denim Jeans',
  'raw-denim-jeans',
  'Premium raw denim jeans with a classic straight cut. Made from 100% cotton denim that will develop a unique patina over time. Crafted in Japan.',
  185.00,
  9,
  'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800',
  (SELECT id FROM categories WHERE slug = 'denim'),
  true
),
(
  'Leather Chelsea Boots',
  'leather-chelsea-boots',
  'Handcrafted leather Chelsea boots with elastic side panels. Made from premium Italian leather with a comfortable rubber sole. A timeless style for any wardrobe.',
  295.00,
  5,
  'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=800',
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