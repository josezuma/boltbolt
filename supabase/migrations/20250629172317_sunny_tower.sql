/*
  # User Creation Trigger

  1. Functions
    - `handle_new_user()` - Creates a user record when a new auth user is created
  
  2. Triggers
    - `on_auth_user_created` - Trigger on auth.users to create a user record
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INT;
BEGIN
  -- Count existing users to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM users;
  
  -- Insert the new user into our custom users table
  INSERT INTO users (id, email, role)
  VALUES (
    NEW.id, 
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'customer'::user_role END
  );
  
  -- For the first user (admin), also create initial store settings
  IF user_count = 0 THEN
    -- Ensure onboarding is not completed for the first admin
    INSERT INTO settings (key, value)
    VALUES ('onboarding_completed', 'false'::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = 'false'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;