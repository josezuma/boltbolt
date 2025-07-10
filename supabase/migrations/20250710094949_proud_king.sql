/*
  # Fix Payment Processing

  1. Problem
    - Current payment implementation doesn't use Stripe Elements
    - Payment processing fails with Stripe API errors
    - Need to update payment processor configuration

  2. Solution
    - Update payment processor settings
    - Ensure proper webhook configuration
    - Fix any database issues related to payment processing

  3. Security
    - Maintain security for payment data
    - Ensure proper error handling
*/

-- Update Stripe configuration in payment_processors table
UPDATE payment_processors
SET configuration = jsonb_set(
  configuration,
  '{use_elements}',
  'true'::jsonb
)
WHERE name = 'stripe';

-- Add settings for Stripe Elements
INSERT INTO settings (key, value)
VALUES 
  ('stripe_elements_enabled', 'true'::jsonb),
  ('payment_form_type', '"elements"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Create index for payment transactions if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_payment_transactions_intent_id 
ON payment_transactions(processor_payment_intent_id);