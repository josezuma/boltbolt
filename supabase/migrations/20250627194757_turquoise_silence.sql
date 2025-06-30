/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - The current RLS policies on the users table are causing infinite recursion
    - This happens when policies reference the same table they're protecting
    - Specifically affects the policy that allows reading user emails for approved reviews

  2. Solution
    - Drop the problematic policy that causes recursion
    - Recreate simplified policies that don't create circular references
    - Use auth.uid() directly instead of querying the users table within policies

  3. Changes
    - Remove the policy "Allow reading user emails for approved reviews" 
    - Simplify user access policies to avoid self-referencing
    - Ensure policies use auth.uid() efficiently
*/

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Allow reading user emails for approved reviews" ON users;
DROP POLICY IF EXISTS "Enable insert for user creation" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create simplified, non-recursive policies

-- Allow users to read their own profile using auth.uid() directly
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile using auth.uid() directly
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public insert for user creation (needed for registration)
CREATE POLICY "Enable insert for user creation"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- For reading user emails in reviews context, we'll handle this differently
-- Instead of a complex policy, we'll allow public read access to basic user info
-- when the user has approved reviews (simplified approach)
CREATE POLICY "Public can read user emails for reviews"
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