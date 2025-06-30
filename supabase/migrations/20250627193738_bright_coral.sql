/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - The existing RLS policies on users table create infinite recursion
    - Policies that check user roles by querying the users table cause circular dependencies
    - Type mismatch between auth.users role and custom user_role enum

  2. Solution
    - Drop problematic policies that cause recursion
    - Create simplified policies that avoid self-referencing the users table
    - Remove admin management policy to prevent recursion
    - Keep essential user access policies only

  3. Security
    - Users can still read and update their own profiles
    - Public access for approved review user emails (safe and necessary)
    - Admin operations should be handled via service role or edge functions
*/

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Allow reading user emails for approved reviews" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Enable insert for user creation" ON users;
DROP POLICY IF EXISTS "Allow user profile creation" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert user profiles" ON users;

-- Create safe policies that don't cause infinite recursion

-- Policy 1: Users can read their own profile
-- This is safe because it only uses auth.uid() which doesn't query the users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile  
-- This is safe because it only uses auth.uid() which doesn't query the users table
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow reading user emails for approved reviews
-- This is safe because it doesn't reference the users table in a circular way
-- It only checks the product_reviews table
CREATE POLICY "Allow reading user emails for approved reviews"
  ON users
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM product_reviews
      WHERE product_reviews.user_id = users.id
        AND product_reviews.is_approved = true
    )
  );

-- Policy 4: Allow user profile creation (for the trigger function)
-- This is needed for the handle_new_user trigger to work
CREATE POLICY "Enable insert for user creation"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Note: We intentionally do NOT create an admin management policy here
-- because any policy that tries to check user roles by querying the users table
-- will create infinite recursion. Admin operations should be handled through:
-- 1. Supabase service role key in edge functions
-- 2. Direct database access through Supabase dashboard  
-- 3. Custom admin interface using service role authentication