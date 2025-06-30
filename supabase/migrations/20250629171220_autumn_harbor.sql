/*
  # Customer Profile Creation Trigger

  1. New Functions
    - `create_customer_profile` - Creates a customer profile when a new user is added
  
  2. Triggers
    - Add trigger to automatically create customer profiles
    
  3. Purpose
    - Ensures every user has a corresponding customer profile
    - Simplifies user management by automating profile creation
*/

-- Create function to handle customer profile creation
CREATE OR REPLACE FUNCTION create_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a customer profile for the new user
  INSERT INTO customer_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_user_created'
  ) THEN
    CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_customer_profile();
  END IF;
END $$;