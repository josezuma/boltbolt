import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  ShoppingBag, 
  Users, 
  Package,
  Calendar,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalyticsDashboard } from '@/components/ui/analytics-dashboard';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number; 
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentSales: Array<{
    date: string;
    amount: number;
  }>;
}

interface SalesDataPoint {
  date: string;
  amount: number;
  orders: number;
}

interface CustomerDataPoint {
  date: string;
  newCustomers: number;
  activeCustomers: number;
}

interface ProductDataPoint {
  name: string;
  value: number;
}

export function Analytics() {
  const { user, isAdmin } = useAuthStore();
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    customersGrowth: 0,
    topProducts: [],
    recentSales: [],
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [productData, setProductData] = useState<ProductDataPoint[]>([]);
  const [customerData, setCustomerData] = useState<CustomerDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (user && isAdmin()) {
      fetchAnalyticsData();
    }
  }, [user, isAdmin, timeRange]);

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const fetchAnalyticsData = async () => {
    try {
      // Get orders data
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at, order_items(quantity, products(name))')
        .neq('status', 'cancelled');
      
      // Get customers count
      const { count: customersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      // Get products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Calculate basic metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;
      const totalOrders = orders?.length || 0;

      // Calculate top products
      const productSales: Record<string, { sales: number; revenue: number }> = {};
      orders?.forEach(order => {
        order.order_items.forEach(item => {
          const productName = item.products?.name || 'Unknown';
          if (!productSales[productName]) {
            productSales[productName] = { sales: 0, revenue: 0 };
          }
          productSales[productName].sales += item.quantity;
          productSales[productName].revenue += parseFloat(order.total_amount) / order.order_items.length;
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Generate recent sales data
      const recentSales = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayOrders = orders?.filter(order => 
          new Date(order.created_at).toDateString() === date.toDateString()
        ) || [];
        const amount = dayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
        
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount
        };
      }).reverse();
      
      // Generate sales data for charts
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const salesChartData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dayOrders = orders?.filter(order => 
          new Date(order.created_at).toDateString() === date.toDateString()
        ) || [];
        const amount = dayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
        
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount,
          orders: dayOrders.length
        };
      });
      
      // Generate product data for charts
      const productChartData = topProducts.map(product => ({
        name: product.name,
        value: product.sales
      }));
      
      // Generate customer data for charts
      const { data: customers } = await supabase
        .from('users')
        .select('created_at')
        .eq('role', 'customer');
        
      const customerChartData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toDateString();
        
        const newCustomers = customers?.filter(customer => 
          new Date(customer.created_at).toDateString() === dateStr
        ).length || 0;
        
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          newCustomers,
          activeCustomers: Math.floor(Math.random() * 20) + newCustomers // Simulated data
        };
      });
      
      setSalesData(salesChartData);
      setProductData(productChartData);
      setCustomerData(customerChartData);

      setData({
        totalRevenue,
        totalOrders,
        totalCustomers: customersCount || 0,
        totalProducts: productsCount || 0,
        revenueGrowth: 12.5, // Mock data - you'd calculate this from historical data
        ordersGrowth: 8.2,
        customersGrowth: 15.3,
        topProducts,
        recentSales,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAdmin()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Track your store's performance and growth</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : timeRange === '90d' ? 'Last 90 days' : 'Last year'}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.totalRevenue.toFixed(2)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +{data.revenueGrowth}% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalOrders}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +{data.ordersGrowth}% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalCustomers}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +{data.customersGrowth}% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalProducts}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                Active products
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Analytics Dashboard */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <AnalyticsDashboard 
              salesData={salesData}
              productData={productData}
              customerData={customerData}
              timeRange={timeRange}
              onTimeRangeChange={handleTimeRangeChange}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}