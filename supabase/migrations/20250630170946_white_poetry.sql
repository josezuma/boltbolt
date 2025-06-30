/*
  # Fix customer profiles RLS policy

  1. Security
    - Add INSERT policy for customer_profiles table to allow authenticated users to create their own profiles
    - This resolves the "new row violates row-level security policy" error

  The policy allows authenticated users to insert rows where their auth.uid() matches the id being inserted.
*/

-- Add INSERT policy for customer_profiles
CREATE POLICY "Users can insert their own profile"
  ON customer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);