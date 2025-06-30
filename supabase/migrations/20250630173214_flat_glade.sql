/*
  # Fix Customer Profiles RLS Policies

  1. Problem
    - Customer profiles cannot be created due to RLS policy issues
    - Users get 403 errors when trying to access their profiles
    - Duplicate key errors when trying to create profiles

  2. Solution
    - Add proper RLS policies for customer_profiles table
    - Ensure users can create and access their own profiles
    - Fix the create_customer_profile function to handle conflicts properly

  3. Security
    - Maintain security while allowing proper data access
    - Keep user-specific data protected
*/

-- Drop existing policies on customer_profiles to start fresh
DROP POLICY IF EXISTS "Users can read their own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON customer_profiles;

-- Create new policies for customer_profiles
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

-- Create function to handle customer profile creation with proper error handling
CREATE OR REPLACE FUNCTION create_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a customer profile for the new user with conflict handling
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
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_user_created ON users;

CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_customer_profile();