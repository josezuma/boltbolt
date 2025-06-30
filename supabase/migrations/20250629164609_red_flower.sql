/*
  # Enhanced Product Reviews System

  1. Updates
    - Add helpful_count to product_reviews table
    - Add reported field to product_reviews table
    - Add review_images table for review photos
    - Add review_comments table for review responses

  2. Features
    - Track helpful votes on reviews
    - Allow flagging inappropriate reviews
    - Support image uploads with reviews
    - Enable admin responses to reviews

  3. Security
    - Maintain existing RLS policies
    - Add appropriate policies for new tables
*/

-- Add new columns to product_reviews table
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS helpful_count integer DEFAULT 0;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS reported boolean DEFAULT false;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS admin_response text DEFAULT NULL;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS admin_response_at timestamptz DEFAULT NULL;

-- Create review_images table
CREATE TABLE IF NOT EXISTS review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES product_reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create review_helpful_votes table to track who found reviews helpful
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Create review_reports table to track reported reviews
CREATE TABLE IF NOT EXISTS review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz DEFAULT NULL,
  UNIQUE(review_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for review_images
CREATE POLICY "Public can read review images"
  ON review_images
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM product_reviews
      WHERE product_reviews.id = review_images.review_id
      AND product_reviews.is_approved = true
    )
  );

CREATE POLICY "Users can insert their own review images"
  ON review_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_reviews
      WHERE product_reviews.id = review_images.review_id
      AND product_reviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage review images"
  ON review_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create policies for review_helpful_votes
CREATE POLICY "Users can vote on reviews"
  ON review_helpful_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes"
  ON review_helpful_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read helpful votes"
  ON review_helpful_votes
  FOR SELECT
  TO public
  USING (true);

-- Create policies for review_reports
CREATE POLICY "Users can report reviews"
  ON review_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage review reports"
  ON review_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id ON review_helpful_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_user_id ON review_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_resolved ON review_reports(resolved);
CREATE INDEX IF NOT EXISTS idx_product_reviews_reported ON product_reviews(reported);
CREATE INDEX IF NOT EXISTS idx_product_reviews_helpful_count ON product_reviews(helpful_count);

-- Create function to update helpful_count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count - 1
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update reported status
CREATE OR REPLACE FUNCTION update_review_reported_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_reviews
    SET reported = true
    WHERE id = NEW.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_helpful_count_on_vote
  AFTER INSERT OR DELETE ON review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

CREATE TRIGGER update_reported_status_on_report
  AFTER INSERT ON review_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_review_reported_status();

-- Insert sample reviews
INSERT INTO product_reviews (
  product_id,
  user_id,
  rating,
  title,
  comment,
  is_verified_purchase,
  is_approved,
  helpful_count
) 
SELECT 
  p.id,
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
  5,
  'Absolutely Love This Product!',
  'I cannot say enough good things about this product. The quality is exceptional, and it has exceeded all my expectations. Highly recommend to anyone considering a purchase!',
  true,
  true,
  12
FROM products p
WHERE p.slug = 'cashmere-turtleneck-sweater'
AND NOT EXISTS (
  SELECT 1 FROM product_reviews WHERE product_id = p.id AND title = 'Absolutely Love This Product!'
)
LIMIT 1;

INSERT INTO product_reviews (
  product_id,
  user_id,
  rating,
  title,
  comment,
  is_verified_purchase,
  is_approved,
  helpful_count
) 
SELECT 
  p.id,
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
  4,
  'Great Value for Money',
  'This product offers excellent value for the price. The materials are high quality and the craftsmanship is evident. I would definitely purchase again.',
  true,
  true,
  8
FROM products p
WHERE p.slug = 'leather-crossbody-bag'
AND NOT EXISTS (
  SELECT 1 FROM product_reviews WHERE product_id = p.id AND title = 'Great Value for Money'
)
LIMIT 1;

INSERT INTO product_reviews (
  product_id,
  user_id,
  rating,
  title,
  comment,
  is_verified_purchase,
  is_approved,
  helpful_count
) 
SELECT 
  p.id,
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
  3,
  'Good but Could Be Better',
  'The product is good overall, but there are a few areas that could be improved. The sizing runs a bit small, so I would recommend ordering a size up. Otherwise, the quality is decent for the price.',
  true,
  true,
  5
FROM products p
WHERE p.slug = 'minimalist-sneakers'
AND NOT EXISTS (
  SELECT 1 FROM product_reviews WHERE product_id = p.id AND title = 'Good but Could Be Better'
)
LIMIT 1;