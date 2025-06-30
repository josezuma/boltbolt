import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Mail, ArrowRight, ShoppingBag, Calendar, CreditCard, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import type { Database } from '@/lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Array<{
    id: string,
    quantity: number,
    price: string,
    products: {
      name: string,
      image_url: string | null,
    } | null,
  }>;
  payment_transactions?: Array<{
    id: string,
    status: string,
    payment_method: any,
    processed_at: string,
  }>;
};

export function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Track if this is a new order (for animation purposes)
  const [isNewOrder, setIsNewOrder] = useState(true);

  useEffect(() => {
    if (orderId && user) {
      fetchOrder();
    }
    
    // After 5 seconds, set isNewOrder to false to stop animations
    const timer = setTimeout(() => {
      setIsNewOrder(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [orderId, user]);

  const fetchOrder = async () => {
    if (!orderId || !user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *, 
          order_items (
            id,
            quantity,
            price,
            products (
              name,
              image_url
            )
          ),
          payment_transactions (
            id,
            status,
            payment_method,
            processed_at
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">The order you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const shippingAddress = order.shipping_address as any;

  return (
    <div className="min-h-screen bg-background">
      <div className="container-editorial py-12">
        {/* Success Header with enhanced animation */}
        <div className="text-center mb-12">
          <div className={`w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${isNewOrder ? 'animate-bounce' : ''}`}>
            <CheckCircle className={`w-12 h-12 text-white ${isNewOrder ? 'animate-pulse' : ''}`} />
          </div>
          <h1 className={`text-editorial-heading mb-4 text-green-800 ${isNewOrder ? 'animate-fade-in-up' : ''}`}>
            Order Confirmed!
          </h1>
          <p className={`text-editorial-body text-muted-foreground max-w-2xl mx-auto text-lg ${isNewOrder ? 'animate-fade-in-up animation-delay-200' : ''}`}>
            Thank you for your purchase! Your payment was successful and we'll begin processing your items right away.
          </p>
          <p className={`text-sm text-green-600 mt-4 ${isNewOrder ? 'animate-fade-in-up animation-delay-300' : ''}`}>
            A confirmation email has been sent to <span className="font-semibold">{user?.email || 'your email address'}</span>
          </p>
          
          {/* Order Summary Card */}
          <div className={`max-w-md mx-auto mt-8 ${isNewOrder ? 'animate-fade-in-up animation-delay-400' : ''}`}>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6 pb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-green-800">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-green-600">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 px-3 py-1">
                    {order.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Items:</span>
                  <span className="font-medium text-green-800">{order.order_items.length}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Payment:</span>
                  <span className="font-medium text-green-800">
                    <span className="flex items-center">
                      {order.payment_transactions && order.payment_transactions[0]?.status === 'succeeded' 
                        ? <><CheckCircle className="w-3 h-3 mr-1 text-green-600" /> Completed</>
                        : <><Clock className="w-3 h-3 mr-1 text-yellow-600" /> Processing</>}
                    </span>
                  </span>
                </div>
                
                <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-green-200">
                  <span className="text-green-800">Total:</span>
                  <span className="text-green-800">${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Order Details */}
          <div className="space-y-8">
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Details
                </CardTitle>
                <CardDescription>
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Items */}
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <img
                        src={item.products?.image_url || 'https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg?auto=compress&cs=tinysrgb&w=200'}
                        alt={item.products?.name || 'Product'}
                        className="w-16 h-16 object-cover bg-muted"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.products?.name}</h4>
                        <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Order Total */}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shippingAddress && (
                  <div className="space-y-2">
                    <p className="font-medium">
                      {shippingAddress.firstName} {shippingAddress.lastName}
                    </p>
                    <p>{shippingAddress.address}</p>
                    <p>
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                    </p>
                    <p>{shippingAddress.country}</p>
                    {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <div className="space-y-8">
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  What's Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-primary-foreground text-xs font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Order Confirmation</h4>
                      <p className="text-muted-foreground text-sm">
                        You'll receive an email confirmation shortly with your order details.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-muted-foreground text-xs font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Processing</h4>
                      <p className="text-muted-foreground text-sm">
                        We'll prepare your items for shipment within 1-2 business days.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-muted-foreground text-xs font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Shipping</h4>
                      <p className="text-muted-foreground text-sm">
                        You'll receive tracking information once your order ships.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-muted-foreground text-xs font-bold">4</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Delivery</h4>
                    <p className="text-muted-foreground text-sm">
                      Your order will arrive within 3-7 business days.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Estimated delivery: {new Date(new Date().setDate(new Date().getDate() + 7)).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Estimated ship date: {new Date(new Date().setDate(new Date().getDate() + 2)).toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      We're preparing your items for shipment (1-2 business days).
                    </p>
                    <p className="text-muted-foreground text-sm">
                      We've sent an email confirmation with your order details.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Button asChild className="btn-editorial-primary w-full">
                    <Link to="/orders">
                      <Calendar className="w-4 h-4 mr-2" />
                      View Order Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full hover:bg-blue-50 hover:text-blue-600">
                    <Link to="/products">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>
                  Our customer service team is here for you
                </CardDescription>
                <CardDescription>
                  Our customer service team is here for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-6">
                  If you have any questions about your order <span className="font-mono font-medium">{order.id.slice(0, 8).toUpperCase()}</span>, please don't hesitate to contact us.
                </p>
                <Button asChild variant="outline" className="w-full hover:bg-blue-50 hover:text-blue-600">
                  <Link to="/contact">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Payment Details */}
            {order.payment_transactions && order.payment_transactions.length > 0 && (
              <Card className="card-editorial mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium">
                        {order.payment_transactions[0].status === 'succeeded' ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Successful
                          </span>
                        ) : (
                          order.payment_transactions[0].status
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-medium">
                        {order.payment_transactions[0].payment_method?.type === 'card' ? (
                          <span>
                            {order.payment_transactions[0].payment_method?.brand || 'Card'} •••• {order.payment_transactions[0].payment_method?.last4 || '****'}
                          </span>
                        ) : (
                          order.payment_transactions[0].payment_method?.type || 'Unknown'
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {order.payment_transactions[0].processed_at ? 
                          new Date(order.payment_transactions[0].processed_at).toLocaleString() : 
                          new Date(order.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono text-sm">
                        {order.payment_transactions[0].processor_transaction_id || 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Recommended Products Teaser */}
            <Card className="card-editorial mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
              <CardContent className="pt-6">
                <div className="text-center">
                  <ShoppingBag className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-blue-800 mb-2">You Might Also Like</h3>
                  <p className="text-blue-600 text-sm mb-6">
                    Discover more products that match your style
                  </p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                    <Link to="/products">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}