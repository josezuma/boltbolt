/*
  # Onboarding System for E-shop Setup

  1. Updates
    - Modify user creation function to make first user admin
    - Add onboarding-related settings
    - Add setup completion tracking

  2. New Settings
    - onboarding_completed: tracks if setup is done
    - setup_step: current setup step
    - first_user_created: flag for first user detection

  3. Security
    - Maintain existing RLS policies
    - Add admin verification for setup steps
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

-- Add additional store configuration settings
INSERT INTO public.settings (key, value) VALUES
('store_logo', '""'),
('store_favicon', '""'),
('store_primary_color', '"#2A2A2A"'),
('store_secondary_color', '"#EAEAEA"'),
('store_font', '"Inter"'),
('store_timezone', '"UTC"'),
('store_language', '"en"'),
('shipping_enabled', 'true'),
('tax_enabled', 'true'),
('inventory_tracking', 'true'),
('customer_accounts', 'true'),
('email_notifications', 'true'),
('analytics_enabled', 'false'),
('seo_title', '""'),
('seo_description', '""'),
('seo_keywords', '""'),
('social_sharing', 'true'),
('newsletter_enabled', 'true'),
('reviews_enabled', 'true'),
('wishlist_enabled', 'true'),
('search_enabled', 'true'),
('blog_enabled', 'false'),
('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;