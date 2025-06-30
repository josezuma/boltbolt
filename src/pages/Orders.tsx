import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import type { Database } from '@/lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Array<{
    id: string;
    quantity: number;
    price: string;
    products: {
      name: string;
      image_url: string | null;
    } | null;
  }>;
};

export function Orders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

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
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-8">You need to be signed in to view your orders.</p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-editorial py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-editorial py-12">
        <div className="mb-8">
          <h1 className="text-editorial-heading mb-4">My Orders</h1>
          <p className="text-editorial-body text-muted-foreground">
            Track and manage your orders
          </p>
        </div>

        {orders.length === 0 ? (
          <Card className="card-editorial text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-4">No Orders Yet</h3>
              <p className="text-muted-foreground mb-8">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Button asChild>
                <Link to="/products">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="card-editorial">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-2">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${parseFloat(order.total_amount).toFixed(2)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/order/${order.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.order_items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <img
                          src={item.products?.image_url || 'https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg?auto=compress&cs=tinysrgb&w=200'}
                          alt={item.products?.name || 'Product'}
                          className="w-12 h-12 object-cover bg-muted rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.products?.name}</h4>
                          <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-sm">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                    {order.order_items.length > 3 && (
                      <p className="text-muted-foreground text-sm">
                        +{order.order_items.length - 3} more item(s)
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}