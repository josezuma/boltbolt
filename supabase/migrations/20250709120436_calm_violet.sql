/*
  # Fix User Registration Error

  1. Problem
    - Database error when saving new users
    - Error in handle_new_user trigger function
    - Possible conflict with RLS policies

  2. Solution
    - Simplify the handle_new_user function
    - Ensure proper error handling
    - Fix RLS policies to allow user creation
    - Ensure proper permissions for the trigger function

  3. Security
    - Maintain security while allowing user registration
    - Keep user-specific data protected
*/

-- Drop existing trigger and function to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a simplified handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  user_role user_role;
BEGIN
  -- Count existing users to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- Determine role based on user count
  IF user_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := 'customer';
  END IF;

  -- Insert the new user into our custom users table
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, user_role);
  
  -- For the first user (admin), also create initial settings
  IF user_count = 0 THEN
    -- Ensure onboarding is not completed for the first admin
    INSERT INTO public.settings (key, value)
    VALUES ('onboarding_completed', 'false'::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = 'false'::jsonb;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
    -- Re-raise the exception to fail the auth operation with a clear message
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$;

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure users table has the right RLS policies
-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for user creation" ON users;

-- Create simplified policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for user creation"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create a function to create customer profiles
CREATE OR REPLACE FUNCTION public.create_customer_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a customer profile for the new user
  INSERT INTO customer_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE LOG 'Error creating customer profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for customer profile creation
DROP TRIGGER IF EXISTS on_user_created ON users;

CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_customer_profile();

-- Ensure customer_profiles has the right RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;

CREATE POLICY "Users can read own profile"
  ON customer_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON customer_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON customer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());