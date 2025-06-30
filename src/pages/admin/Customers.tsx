import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye,
  Users,
  Mail,
  Calendar,
  ShoppingBag,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { executeQuery } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Customer = Database['public']['Tables']['users']['Row'] & {
  orders: Array<{
    id: string;
    total_amount: string;
    status: string;
    created_at: string;
  }>;
};

export function Customers() {
  const { user, isAdmin } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && isAdmin()) {
      fetchCustomers();
    }
  }, [user, isAdmin]);

  const fetchCustomers = async () => {
    try {
      const data = await executeQuery(
        () => supabase
          .from('users')
          .select(`
            *,
            orders (
              id,
              total_amount,
              status,
              created_at
            )
          `)
          .eq('role', 'customer')
          .order('created_at', { ascending: false }),
        'fetch customers'
      );
      
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerStats = (customer: Customer) => {
    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
    const lastOrderDate = customer.orders.length > 0 
      ? new Date(customer.orders[0].created_at).toLocaleDateString()
      : 'Never';
    
    return { totalOrders, totalSpent, lastOrderDate };
  };

  const filteredCustomers = customers.filter(customer =>
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, customer) => 
    sum + customer.orders.reduce((orderSum, order) => orderSum + parseFloat(order.total_amount), 0), 0
  );
  const averageOrderValue = totalRevenue / customers.reduce((sum, customer) => sum + customer.orders.length, 0) || 0;

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

  return (
    <div>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">Manage your customer relationships</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              All Customers ({filteredCustomers.length})
            </CardTitle>
            <CardDescription>
              View and manage customer information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <Users className="w-12 h-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No customers found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const stats = getCustomerStats(customer);
                      
                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {customer.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{customer.email}</p>
                                <p className="text-sm text-muted-foreground">Customer</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{stats.totalOrders}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">${stats.totalSpent.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            {stats.lastOrderDate}
                          </TableCell>
                          <TableCell>
                            {new Date(customer.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/customers/${customer.id}`}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}