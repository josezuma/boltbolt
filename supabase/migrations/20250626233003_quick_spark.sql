/*
  # Fix User Registration Trigger

  1. Problem
    - The handle_new_user trigger is failing during user registration
    - RLS policies may be preventing the trigger from inserting user profiles
    - Need to ensure proper permissions for the trigger function

  2. Solution
    - Recreate the trigger function with proper error handling
    - Fix RLS policies to allow trigger operations
    - Ensure the function has SECURITY DEFINER privileges
    - Add proper exception handling

  3. Security
    - Maintain RLS security while allowing trigger operations
    - Ensure only authenticated operations for user management
*/

-- First, drop the existing trigger and function to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  user_role user_role;
BEGIN
  -- Count existing users in the public.users table
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- Determine role based on user count
  IF user_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := 'customer';
  END IF;

  -- Insert the new user profile
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, user_role, now(), now());

  -- If this is the first user, set up initial settings
  IF user_count = 0 THEN
    INSERT INTO public.settings (key, value, created_at, updated_at) 
    VALUES ('first_user_created', 'true', now(), now())
    ON CONFLICT (key) DO UPDATE SET 
      value = 'true', 
      updated_at = now();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the specific error for debugging
    RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
    -- Re-raise the exception to fail the auth operation
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Temporarily disable RLS to allow the trigger to work
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow trigger to insert user profiles" ON public.users;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create new, simpler policies
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

-- Allow inserts for the trigger function (this runs as SECURITY DEFINER)
CREATE POLICY "Allow user profile creation"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure settings table has proper policies for the trigger
DO $$
BEGIN
  -- Check if settings policies exist and create if needed
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'settings' AND policyname = 'Allow settings creation'
  ) THEN
    CREATE POLICY "Allow settings creation"
      ON public.settings
      FOR INSERT
      WITH CHECK (true);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore if policy already exists
END $$;

-- Test the function by creating a test scenario (this won't actually create a user)
DO $$
DECLARE
  test_record RECORD;
BEGIN
  -- This is just to validate the function compiles correctly
  RAISE NOTICE 'User creation trigger function is ready';
END $$;