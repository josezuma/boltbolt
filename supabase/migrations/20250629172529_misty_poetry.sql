/*
  # Inventory Management Functions

  1. Functions
    - `handle_inventory_update()` - Tracks inventory changes when product stock is updated
  
  2. Triggers
    - `track_product_inventory_changes` - Trigger on products table to track stock changes
*/

-- Create function to handle inventory updates
CREATE OR REPLACE FUNCTION handle_inventory_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track changes when stock is updated
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    INSERT INTO inventory_transactions (
      product_id,
      quantity,
      previous_stock,
      new_stock,
      transaction_type,
      reference_id,
      reference_type,
      created_by
    ) VALUES (
      NEW.id,
      NEW.stock - OLD.stock,
      OLD.stock,
      NEW.stock,
      CASE 
        WHEN NEW.stock > OLD.stock THEN 'stock_increase'
        ELSE 'stock_decrease'
      END,
      NULL,
      'manual_update',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'track_product_inventory_changes'
  ) THEN
    CREATE TRIGGER track_product_inventory_changes
    AFTER UPDATE OF stock ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_inventory_update();
  END IF;
END $$;