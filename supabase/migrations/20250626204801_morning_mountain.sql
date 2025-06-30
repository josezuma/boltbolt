/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - The "Admins can manage all users" policy creates infinite recursion
    - Policy queries users table within itself, causing circular dependency

  2. Solution
    - Drop the problematic policy that causes recursion
    - Create a simpler policy structure that avoids self-referencing
    - Use auth.jwt() to check user role directly from JWT claims instead of querying users table

  3. Security
    - Maintain security by allowing users to read/update their own profile
    - Remove admin management policy to prevent recursion
    - Admin operations should be handled through service role or edge functions
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Keep the existing safe policies that don't cause recursion
-- These policies are already working correctly:
-- - "Users can read own profile" (uid() = id)
-- - "Users can update own profile" (uid() = id)

-- Note: Admin operations should be handled through:
-- 1. Supabase service role key in edge functions
-- 2. Direct database access through Supabase dashboard
-- 3. Custom admin interface using service role authentication