/*
  # Enable Stripe Elements Integration

  1. Updates
    - Add configuration to use Stripe Elements in payment_processors table
    - Add settings for Stripe Elements integration
    - Add index for payment transactions by intent ID

  2. Purpose
    - Enable Stripe Elements for a more secure payment experience
    - Improve payment flow with standardized UI components
    - Optimize database queries for payment transactions
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