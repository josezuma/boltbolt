/*
  # Fix Customer Profile Duplicate Key Error

  1. Problem
    - Duplicate key violation when trying to create customer profiles
    - Multiple attempts to create the same profile are happening
    - Need to ensure proper ON CONFLICT handling

  2. Solution
    - Update the create_customer_profile function to use ON CONFLICT DO NOTHING
    - Ensure the ShippingForm component properly handles existing profiles
    - Fix the customer_profiles insert policy to prevent duplicates
*/

-- Drop the existing function and recreate it with proper conflict handling
CREATE OR REPLACE FUNCTION create_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a customer profile for the new user with conflict handling
  INSERT INTO customer_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the policy allows users to insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customer_profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON customer_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;