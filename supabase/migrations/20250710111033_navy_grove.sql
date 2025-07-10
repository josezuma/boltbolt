/*
  # Enable Stripe Elements

  1. Updates
    - Enable Stripe Elements in payment processor configuration
    - Add settings for using Stripe Elements in checkout
    - Add index for payment transactions by intent ID

  2. Purpose
    - Improve checkout experience with native Stripe Elements
    - Enhance security by using Stripe's hosted payment form
    - Better handle payment processing and validation
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