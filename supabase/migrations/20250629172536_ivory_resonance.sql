/*
  # Review Helpful Votes Functions

  1. Functions
    - `update_review_helpful_count()` - Updates the helpful count on product reviews
    - `update_review_reported_status()` - Updates the reported status on product reviews
  
  2. Triggers
    - `update_helpful_count_on_vote` - Trigger on review_helpful_votes to update count
    - `update_reported_status_on_report` - Trigger on review_reports to update status
*/

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