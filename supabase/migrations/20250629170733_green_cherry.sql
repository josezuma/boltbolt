/*
  # Payment System Implementation
  
  1. New Tables
    - `payment_processors` - Stores payment gateway configurations
    - `payment_transactions` - Records payment transactions
    - `payment_refunds` - Tracks refund information
    - `webhook_events` - Stores incoming webhook events from payment processors
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Ensure only admins can manage payment configurations
    - Allow users to view their own payment data
  
  3. Performance
    - Add indexes for frequently queried columns
    - Add unique constraints for webhook events
*/

-- Create payment_status enum if it doesn't exist
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
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_test_mode boolean DEFAULT false,
    configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
    webhook_endpoints jsonb DEFAULT '[]'::jsonb,
    webhook_secret text,
    supported_currencies text[] DEFAULT '{USD}'::text[],
    supported_countries text[] DEFAULT '{US}'::text[],
    supported_payment_methods text[] DEFAULT '{card}'::text[],
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    payment_processor_id uuid REFERENCES payment_processors(id) ON DELETE RESTRICT,
    processor_transaction_id text,
    processor_payment_intent_id text,
    processor_customer_id text,
    amount numeric(10,2) NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    payment_method jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    processor_response jsonb DEFAULT '{}'::jsonb,
    failure_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    processed_at timestamptz,
    failed_at timestamptz
);

-- Create payment_refunds table
CREATE TABLE IF NOT EXISTS payment_refunds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE CASCADE,
    processor_refund_id text,
    amount numeric(10,2) NOT NULL,
    currency text NOT NULL,
    reason text,
    status payment_status DEFAULT 'pending',
    metadata jsonb DEFAULT '{}'::jsonb,
    processor_response jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    processed_at timestamptz
);

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_processor_id uuid REFERENCES payment_processors(id) ON DELETE CASCADE,
    event_id text NOT NULL,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    processed boolean DEFAULT false,
    processed_at timestamptz,
    processing_attempts integer DEFAULT 0,
    last_processing_error text,
    payment_transaction_id uuid REFERENCES payment_transactions(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Add unique constraint to webhook_events (with a different name to avoid conflict)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'webhook_events'::regclass::oid 
        AND contype = 'u'
        AND conkey @> ARRAY[
            (SELECT attnum FROM pg_attribute WHERE attrelid = 'webhook_events'::regclass AND attname = 'payment_processor_id'),
            (SELECT attnum FROM pg_attribute WHERE attrelid = 'webhook_events'::regclass AND attname = 'event_id')
        ]::smallint[]
    ) THEN
        ALTER TABLE webhook_events 
        ADD CONSTRAINT webhook_events_processor_event_unique 
        UNIQUE (payment_processor_id, event_id);
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_processors (check if they exist first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_processors' AND policyname = 'Public can read active payment processors') THEN
        CREATE POLICY "Public can read active payment processors" ON payment_processors
          FOR SELECT TO public
          USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_processors' AND policyname = 'Admins can insert payment processors') THEN
        CREATE POLICY "Admins can insert payment processors" ON payment_processors
          FOR INSERT TO authenticated
          WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_processors' AND policyname = 'Admins can update payment processors') THEN
        CREATE POLICY "Admins can update payment processors" ON payment_processors
          FOR UPDATE TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_processors' AND policyname = 'Admins can delete payment processors') THEN
        CREATE POLICY "Admins can delete payment processors" ON payment_processors
          FOR DELETE TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
END $$;

-- Create policies for payment_transactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'Users can read their own payment transactions') THEN
        CREATE POLICY "Users can read their own payment transactions" ON payment_transactions
          FOR SELECT TO authenticated
          USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = payment_transactions.order_id AND orders.user_id = uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'Admins can select all payment transactions') THEN
        CREATE POLICY "Admins can select all payment transactions" ON payment_transactions
          FOR SELECT TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'Admins can insert payment transactions') THEN
        CREATE POLICY "Admins can insert payment transactions" ON payment_transactions
          FOR INSERT TO authenticated
          WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'Admins can update payment transactions') THEN
        CREATE POLICY "Admins can update payment transactions" ON payment_transactions
          FOR UPDATE TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_transactions' AND policyname = 'Admins can delete payment transactions') THEN
        CREATE POLICY "Admins can delete payment transactions" ON payment_transactions
          FOR DELETE TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
END $$;

-- Create policies for payment_refunds
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_refunds' AND policyname = 'Users can read their own payment refunds') THEN
        CREATE POLICY "Users can read their own payment refunds" ON payment_refunds
          FOR SELECT TO authenticated
          USING (EXISTS (
            SELECT 1 FROM payment_transactions pt
            JOIN orders o ON o.id = pt.order_id
            WHERE pt.id = payment_refunds.payment_transaction_id
            AND o.user_id = uid()
          ));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_refunds' AND policyname = 'Admins can select payment refunds') THEN
        CREATE POLICY "Admins can select payment refunds" ON payment_refunds
          FOR SELECT TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_refunds' AND policyname = 'Admins can insert payment refunds') THEN
        CREATE POLICY "Admins can insert payment refunds" ON payment_refunds
          FOR INSERT TO authenticated
          WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_refunds' AND policyname = 'Admins can update payment refunds') THEN
        CREATE POLICY "Admins can update payment refunds" ON payment_refunds
          FOR UPDATE TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_refunds' AND policyname = 'Admins can delete payment refunds') THEN
        CREATE POLICY "Admins can delete payment refunds" ON payment_refunds
          FOR DELETE TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
END $$;

-- Create policies for webhook_events
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Admins can select webhook events') THEN
        CREATE POLICY "Admins can select webhook events" ON webhook_events
          FOR SELECT TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Admins can insert webhook events') THEN
        CREATE POLICY "Admins can insert webhook events" ON webhook_events
          FOR INSERT TO authenticated
          WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Admins can update webhook events') THEN
        CREATE POLICY "Admins can update webhook events" ON webhook_events
          FOR UPDATE TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Admins can delete webhook events') THEN
        CREATE POLICY "Admins can delete webhook events" ON webhook_events
          FOR DELETE TO authenticated
          USING (EXISTS (SELECT 1 FROM users WHERE users.id = uid() AND users.role = 'admin'));
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_processors_name ON payment_processors(name);
CREATE INDEX IF NOT EXISTS idx_payment_processors_active ON payment_processors(is_active);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_processor_id ON payment_transactions(payment_processor_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_processor_transaction_id ON payment_transactions(processor_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_processor_payment_intent_id ON payment_transactions(processor_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_transaction_id ON payment_refunds(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_processor_refund_id ON payment_refunds(processor_refund_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_status ON payment_refunds(status);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processor_id ON webhook_events(payment_processor_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_transaction_id ON webhook_events(payment_transaction_id);

-- Create triggers for updated_at (check if they exist first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_processors_updated_at') THEN
        CREATE TRIGGER update_payment_processors_updated_at
        BEFORE UPDATE ON payment_processors
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_transactions_updated_at') THEN
        CREATE TRIGGER update_payment_transactions_updated_at
        BEFORE UPDATE ON payment_transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_refunds_updated_at') THEN
        CREATE TRIGGER update_payment_refunds_updated_at
        BEFORE UPDATE ON payment_refunds
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert default payment processor (Stripe)
INSERT INTO payment_processors (
  name,
  display_name,
  description,
  is_active,
  is_test_mode,
  configuration,
  supported_currencies,
  supported_payment_methods
) VALUES (
  'stripe',
  'Stripe',
  'Stripe payment processing',
  true,
  true,
  '{"publishable_key": "", "secret_key": "", "webhook_secret": ""}'::jsonb,
  '{USD,EUR,GBP,CAD,AUD}'::text[],
  '{card,apple_pay,google_pay}'::text[]
)
ON CONFLICT (name) DO NOTHING;