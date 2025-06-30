import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyCartMessage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Add some items to your cart to proceed to checkout.</p>
        <Button asChild>
          <a href="/products">Browse Products</a>
        </Button>
      </div>
    </div>
  );
}