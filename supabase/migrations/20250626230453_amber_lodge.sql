/*
  # E-commerce Onboarding System

  1. Updates
    - Modify handle_new_user function to make first user admin
    - Add onboarding-related settings
    - Add store configuration settings

  2. Features
    - First user becomes admin automatically
    - Track onboarding progress
    - Store configuration settings
    - Payment processor setup tracking
*/

-- Update the handle_new_user function to make first user admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_count integer;
    user_role user_role;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM public.users;
    
    -- If this is the first user, make them admin
    IF user_count = 0 THEN
        user_role := 'admin';
        
        -- Set first user created flag
        INSERT INTO public.settings (key, value) 
        VALUES ('first_user_created', 'true')
        ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = now();
    ELSE
        user_role := 'customer';
    END IF;
    
    -- Insert the new user
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, user_role);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add onboarding-related settings
INSERT INTO public.settings (key, value) VALUES
('onboarding_completed', 'false'),
('setup_step', '0'),
('store_configured', 'false'),
('payment_configured', 'false'),
('products_added', 'false'),
('design_configured', 'false')
ON CONFLICT (key) DO NOTHING;

-- Add comprehensive store configuration settings
INSERT INTO public.settings (key, value) VALUES
-- Basic Store Info
('store_logo', '""'),
('store_favicon', '""'),
('store_primary_color', '"#2A2A2A"'),
('store_secondary_color', '"#EAEAEA"'),
('store_font', '"Inter"'),
('store_timezone', '"UTC"'),
('store_language', '"en"'),

-- Business Settings
('shipping_enabled', 'true'),
('tax_enabled', 'true'),
('inventory_tracking', 'true'),
('customer_accounts', 'true'),
('email_notifications', 'true'),

-- Marketing & Analytics
('analytics_enabled', 'false'),
('google_analytics_id', '""'),
('facebook_pixel_id', '""'),
('seo_title', '""'),
('seo_description', '""'),
('seo_keywords', '""'),

-- Features
('social_sharing', 'true'),
('newsletter_enabled', 'true'),
('reviews_enabled', 'true'),
('wishlist_enabled', 'true'),
('search_enabled', 'true'),
('blog_enabled', 'false'),

-- System
('maintenance_mode', 'false'),
('backup_enabled', 'true'),
('ssl_enabled', 'true'),

-- Notifications
('order_notifications', 'true'),
('low_stock_notifications', 'true'),
('customer_notifications', 'true'),

-- Payment Settings
('stripe_test_mode', 'true'),
('stripe_publishable_key', '""'),
('stripe_secret_key', '""'),
('stripe_webhook_secret', '""'),
('paypal_enabled', 'false'),
('paypal_client_id', '""'),
('paypal_client_secret', '""'),

-- Shipping Settings
('free_shipping_threshold', '50'),
('default_shipping_rate', '5.99'),
('international_shipping', 'false'),
('shipping_zones', '[]'),

-- Tax Settings
('tax_inclusive', 'false'),
('default_tax_rate', '0.08'),
('tax_by_location', 'false'),

-- Email Settings
('smtp_enabled', 'false'),
('smtp_host', '""'),
('smtp_port', '587'),
('smtp_username', '""'),
('smtp_password', '""'),
('from_email', '""'),
('from_name', '""')

ON CONFLICT (key) DO NOTHING;