import { Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  stock: number;
}

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export function OrderSummary({ items, subtotal, shipping, tax, total }: OrderSummaryProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>
          {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted flex-shrink-0">
                <img
                  src={item.image_url || 'https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Order Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Shipping Method */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Shipping Method</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Truck className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-sm">Standard Shipping</span>
            </div>
            <span className="text-sm font-medium">
              {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Delivery in 3-5 business days
          </p>
        </div>
      </CardContent>
    </Card>
  );
}