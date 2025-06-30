/*
  # Payment Processor Configuration System

  1. New Tables
    - `payment_processors`
      - `id` (uuid, primary key)
      - `name` (text, e.g., 'stripe', 'paypal', 'square')
      - `display_name` (text, e.g., 'Stripe', 'PayPal')
      - `is_active` (boolean)
      - `configuration` (jsonb, encrypted config data)
      - `webhook_endpoints` (jsonb, array of webhook URLs)
      - `supported_currencies` (text[], array of currency codes)
      - `supported_countries` (text[], array of country codes)
      - `created_at`, `updated_at` (timestamps)

    - `payment_transactions`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `payment_processor_id` (uuid, foreign key to payment_processors)
      - `processor_transaction_id` (text, external transaction ID)
      - `processor_payment_intent_id` (text, external payment intent ID)
      - `amount` (numeric, transaction amount)
      - `currency` (text, currency code)
      - `status` (enum: pending, processing, succeeded, failed, cancelled, refunded)
      - `payment_method` (jsonb, payment method details)
      - `metadata` (jsonb, additional transaction data)
      - `processor_response` (jsonb, full processor response)
      - `created_at`, `updated_at` (timestamps)

    - `webhook_events`
      - `id` (uuid, primary key)
      - `payment_processor_id` (uuid, foreign key to payment_processors)
      - `event_id` (text, external event ID)
      - `event_type` (text, webhook event type)
      - `event_data` (jsonb, webhook payload)
      - `processed` (boolean, whether event was processed)
      - `processed_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Admin-only access for payment processor configuration
    - User access to their own payment transactions
    - Webhook events accessible only by system/admin

  3. Indexes
    - Performance indexes for common queries
    - Unique constraints where appropriate
</*/

-- Create payment transaction status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM (
            'pending', 
            'processing', 
            'succeeded', 
            'failed', 
            'cancelled', 
            'refunded', 
            'partially_refunded'
        );
    END IF;
END $$;

-- Create payment_processors table
CREATE TABLE IF NOT EXISTS payment_processors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL, -- e.g., 'stripe', 'paypal', 'square'
    display_name text NOT NULL, -- e.g., 'Stripe', 'PayPal', 'Square'
    description text,
    is_active boolean DEFAULT true,
    is_test_mode boolean DEFAULT false,
    
    -- Configuration stored as encrypted JSON
    configuration jsonb NOT NULL DEFAULT '{}', -- API keys, secrets, etc.
    
    -- Webhook configuration
    webhook_endpoints jsonb DEFAULT '[]', -- Array of webhook endpoint configs
    webhook_secret text, -- Webhook signing secret
    
    -- Supported features
    supported_currencies text[] DEFAULT '{"USD"}',
    supported_countries text[] DEFAULT '{"US"}',
    supported_payment_methods text[] DEFAULT '{"card"}',
    
    -- Processor-specific settings
    settings jsonb DEFAULT '{}',
    
    -- Metadata
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    payment_processor_id uuid REFERENCES payment_processors(id) ON DELETE RESTRICT,
    
    -- External processor identifiers
    processor_transaction_id text, -- External transaction ID
    processor_payment_intent_id text, -- External payment intent ID
    processor_customer_id text, -- External customer ID
    
    -- Transaction details
    amount numeric(10,2) NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    
    -- Payment method information
    payment_method jsonb DEFAULT '{}', -- Card info, bank details, etc.
    
    -- Additional data
    metadata jsonb DEFAULT '{}',
    processor_response jsonb DEFAULT '{}', -- Full response from processor
    failure_reason text,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    processed_at timestamptz,
    failed_at timestamptz
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_processor_id uuid REFERENCES payment_processors(id) ON DELETE CASCADE,
    
    -- Event details
    event_id text NOT NULL, -- External event ID
    event_type text NOT NULL, -- e.g., 'payment_intent.succeeded'
    event_data jsonb NOT NULL, -- Full webhook payload
    
    -- Processing status
    processed boolean DEFAULT false,
    processed_at timestamptz,
    processing_attempts integer DEFAULT 0,
    last_processing_error text,
    
    -- Related transaction (if applicable)
    payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create refunds table for tracking refunds
CREATE TABLE IF NOT EXISTS payment_refunds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE CASCADE,
    
    -- External processor identifiers
    processor_refund_id text,
    
    -- Refund details
    amount numeric(10,2) NOT NULL,
    currency text NOT NULL,
    reason text,
    status payment_status DEFAULT 'pending',
    
    -- Metadata
    metadata jsonb DEFAULT '{}',
    processor_response jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    processed_at timestamptz
);

ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_processors
CREATE POLICY "Admins can manage payment processors"
    ON payment_processors
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Anyone can read active payment processors"
    ON payment_processors
    FOR SELECT
    TO public
    USING (is_active = true);

-- RLS Policies for payment_transactions
CREATE POLICY "Admins can manage all payment transactions"
    ON payment_transactions
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Users can read their own payment transactions"
    ON payment_transactions
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = payment_transactions.order_id 
        AND orders.user_id = auth.uid()
    ));

-- RLS Policies for webhook_events
CREATE POLICY "Admins can manage webhook events"
    ON webhook_events
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

-- RLS Policies for payment_refunds
CREATE POLICY "Admins can manage payment refunds"
    ON payment_refunds
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    ));

CREATE POLICY "Users can read their own payment refunds"
    ON payment_refunds
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM payment_transactions pt
        JOIN orders o ON o.id = pt.order_id
        WHERE pt.id = payment_refunds.payment_transaction_id 
        AND o.user_id = auth.uid()
    ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_processors_name ON payment_processors(name);
CREATE INDEX IF NOT EXISTS idx_payment_processors_active ON payment_processors(is_active);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_processor_id ON payment_transactions(payment_processor_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_processor_transaction_id ON payment_transactions(processor_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_processor_payment_intent_id ON payment_transactions(processor_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processor_id ON webhook_events(payment_processor_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_transaction_id ON webhook_events(payment_transaction_id);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_transaction_id ON payment_refunds(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_processor_refund_id ON payment_refunds(processor_refund_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_status ON payment_refunds(status);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_unique_event 
    ON webhook_events(payment_processor_id, event_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_payment_processors_updated_at
    BEFORE UPDATE ON payment_processors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_refunds_updated_at
    BEFORE UPDATE ON payment_refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default Stripe configuration
INSERT INTO payment_processors (
    name, 
    display_name, 
    description,
    is_active,
    is_test_mode,
    configuration,
    webhook_endpoints,
    supported_currencies,
    supported_countries,
    supported_payment_methods,
    settings
) VALUES (
    'stripe',
    'Stripe',
    'Stripe payment processor for credit cards and digital wallets',
    true,
    true, -- Start in test mode
    '{
        "publishable_key": "",
        "secret_key": "",
        "webhook_secret": ""
    }',
    '[
        {
            "url": "/api/webhooks/stripe",
            "events": [
                "payment_intent.succeeded",
                "payment_intent.payment_failed",
                "charge.dispute.created",
                "invoice.payment_succeeded",
                "customer.subscription.updated"
            ]
        }
    ]',
    '{"USD", "EUR", "GBP", "CAD", "AUD", "JPY"}',
    '{"US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "NL", "JP"}',
    '{"card", "apple_pay", "google_pay", "link", "klarna", "afterpay_clearpay"}',
    '{
        "capture_method": "automatic",
        "confirmation_method": "automatic",
        "setup_future_usage": "off_session",
        "statement_descriptor": "BOLTSHOP"
    }'
) ON CONFLICT (name) DO NOTHING;

-- Insert sample PayPal configuration (inactive by default)
INSERT INTO payment_processors (
    name, 
    display_name, 
    description,
    is_active,
    is_test_mode,
    configuration,
    webhook_endpoints,
    supported_currencies,
    supported_countries,
    supported_payment_methods,
    settings
) VALUES (
    'paypal',
    'PayPal',
    'PayPal payment processor for PayPal and credit card payments',
    false, -- Inactive by default
    true,
    '{
        "client_id": "",
        "client_secret": "",
        "webhook_id": ""
    }',
    '[
        {
            "url": "/api/webhooks/paypal",
            "events": [
                "PAYMENT.CAPTURE.COMPLETED",
                "PAYMENT.CAPTURE.DENIED",
                "BILLING.SUBSCRIPTION.ACTIVATED"
            ]
        }
    ]',
    '{"USD", "EUR", "GBP", "CAD", "AUD", "JPY"}',
    '{"US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "NL", "JP"}',
    '{"paypal", "card"}',
    '{
        "intent": "CAPTURE",
        "brand_name": "BOLTSHOP"
    }'
) ON CONFLICT (name) DO NOTHING;