/*
  # Fix Review Features Migration
  
  1. New Columns
     - Add helpful_count, reported, admin_response, and admin_response_at to product_reviews
  
  2. New Tables
     - review_images: Store images associated with reviews
     - review_helpful_votes: Track helpful votes on reviews
     - review_reports: Track reported reviews
  
  3. Security
     - Enable RLS on all new tables
     - Add policies with IF NOT EXISTS checks
  
  4. Functions and Triggers
     - Create functions to update helpful count and reported status
     - Create triggers to maintain data integrity
*/

-- Add additional fields to product_reviews if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_reviews' AND column_name = 'helpful_count'
  ) THEN
    ALTER TABLE product_reviews ADD COLUMN helpful_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_reviews' AND column_name = 'reported'
  ) THEN
    ALTER TABLE product_reviews ADD COLUMN reported boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_reviews' AND column_name = 'admin_response'
  ) THEN
    ALTER TABLE product_reviews ADD COLUMN admin_response text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_reviews' AND column_name = 'admin_response_at'
  ) THEN
    ALTER TABLE product_reviews ADD COLUMN admin_response_at timestamptz;
  END IF;
END $$;

-- Create review_images table
CREATE TABLE IF NOT EXISTS review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES product_reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create review_helpful_votes table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Create review_reports table
CREATE TABLE IF NOT EXISTS review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  UNIQUE(review_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for review_images with IF NOT EXISTS checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_images' AND policyname = 'Public can read review images'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_images' AND policyname = 'Users can insert their own review images'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_images' AND policyname = 'Admins can manage review images'
  ) THEN
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
  END IF;
END $$;

-- Create policies for review_helpful_votes with IF NOT EXISTS checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_helpful_votes' AND policyname = 'Anyone can read helpful votes'
  ) THEN
    CREATE POLICY "Anyone can read helpful votes"
      ON review_helpful_votes
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_helpful_votes' AND policyname = 'Users can vote on reviews'
  ) THEN
    CREATE POLICY "Users can vote on reviews"
      ON review_helpful_votes
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_helpful_votes' AND policyname = 'Users can remove their votes'
  ) THEN
    CREATE POLICY "Users can remove their votes"
      ON review_helpful_votes
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create policies for review_reports with IF NOT EXISTS checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_reports' AND policyname = 'Admins can manage review reports'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_reports' AND policyname = 'Users can report reviews'
  ) THEN
    CREATE POLICY "Users can report reviews"
      ON review_reports
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id ON review_helpful_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_user_id ON review_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_resolved ON review_reports(resolved);
CREATE INDEX IF NOT EXISTS idx_product_reviews_helpful_count ON product_reviews(helpful_count);
CREATE INDEX IF NOT EXISTS idx_product_reviews_reported ON product_reviews(reported);

-- Create or replace function to update helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_reviews
    SET helpful_count = GREATEST(helpful_count - 1, 0)
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to update reported status
CREATE OR REPLACE FUNCTION update_review_reported_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_reviews
  SET reported = true
  WHERE id = NEW.review_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers with IF NOT EXISTS checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_helpful_count_on_vote'
  ) THEN
    CREATE TRIGGER update_helpful_count_on_vote
      AFTER INSERT OR DELETE ON review_helpful_votes
      FOR EACH ROW
      EXECUTE FUNCTION update_review_helpful_count();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_reported_status_on_report'
  ) THEN
    CREATE TRIGGER update_reported_status_on_report
      AFTER INSERT ON review_reports
      FOR EACH ROW
      EXECUTE FUNCTION update_review_reported_status();
  END IF;
END $$;