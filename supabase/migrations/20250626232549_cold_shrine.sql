/*
  # Fix user registration database error

  1. Database Functions
    - Create or replace the `handle_new_user` trigger function
    - Create or replace the `update_updated_at_column` trigger function

  2. Triggers
    - Create trigger on auth.users to automatically create user profile
    - Ensure proper permissions and error handling

  3. Security
    - Ensure RLS policies allow the trigger to insert user profiles
    - Add policy for user profile creation during signup
*/

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  user_role user_role;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- If this is the first user, make them an admin
  IF user_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := 'customer';
  END IF;

  -- Insert the new user profile
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, user_role, now(), now());

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure RLS policies allow the trigger to work
-- Add a policy that allows the trigger function to insert user profiles
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Allow trigger to insert user profiles" ON public.users;
  
  -- Create policy for trigger function
  CREATE POLICY "Allow trigger to insert user profiles"
    ON public.users
    FOR INSERT
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Policy already exists, ignore
END $$;

-- Ensure the existing policies are properly configured
DO $$
BEGIN
  -- Drop and recreate the user profile policies to ensure they're correct
  DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
  
  -- Recreate the policies
  CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore errors if policies already exist
END $$;