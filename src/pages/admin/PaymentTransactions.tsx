import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  RefreshCw, 
  MoreHorizontal, 
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Search,
  Filter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type PaymentTransaction = Database['public']['Tables']['payment_transactions']['Row'] & {
  payment_processors: { name: string; display_name: string } | null;
  orders: { id: string; user_id: string; users: { email: string } | null } | null;
};

export function PaymentTransactions() {
  const { user, isAdmin } = useAuthStore();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user && isAdmin()) {
      fetchTransactions();
    }
  }, [user, isAdmin]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          payment_processors (name, display_name),
          orders (id, user_id, users (email))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      toast.error('Failed to load payment transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Succeeded
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <RefreshCw className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <RefreshCw className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        );
      case 'partially_refunded':
        return (
          <Badge className="bg-indigo-100 text-indigo-800">
            <RefreshCw className="w-3 h-3 mr-1" />
            Partially Refunded
          </Badge>
        );
      default:
        return (
          <Badge>
            {status}
          </Badge>
        );
    }
  };

  const viewTransactionDetails = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.processor_transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.processor_payment_intent_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.orders?.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false;
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalAmount = transactions.reduce((sum, transaction) => {
    if (transaction.status === 'succeeded') {
      return sum + parseFloat(transaction.amount);
    }
    return sum;
  }, 0);

  const successfulTransactions = transactions.filter(t => t.status === 'succeeded').length;
  const pendingTransactions = transactions.filter(t => ['pending', 'processing'].includes(t.status)).length;
  const failedTransactions = transactions.filter(t => t.status === 'failed').length;

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
            <h1 className="text-3xl font-bold text-foreground">Payment Transactions</h1>
            <p className="text-muted-foreground">Monitor and manage payment transactions</p>
          </div>
          <Button onClick={fetchTransactions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From successful transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successfulTransactions}</div>
              <p className="text-xs text-muted-foreground">Completed transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <RefreshCw className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTransactions}</div>
              <p className="text-xs text-muted-foreground">Awaiting completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{failedTransactions}</div>
              <p className="text-xs text-muted-foreground">Failed transactions</p>
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
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Transactions
            </CardTitle>
            <CardDescription>
              View and manage payment transactions
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
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Processor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No transactions found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {transaction.processor_transaction_id?.substring(0, 10) || 
                             transaction.processor_payment_intent_id?.substring(0, 10) || 
                             transaction.id.substring(0, 10)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          {transaction.orders?.users?.email || 'Guest'}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {transaction.currency} {parseFloat(transaction.amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transaction.payment_processors?.display_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewTransactionDetails(transaction)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {transaction.orders && (
                                <DropdownMenuItem asChild>
                                  <a href={`/admin/orders/${transaction.orders.id}`}>
                                    <ArrowUpRight className="w-4 h-4 mr-2" />
                                    View Order
                                  </a>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details Dialog */}
        {selectedTransaction && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Transaction Details</DialogTitle>
                <DialogDescription>
                  Transaction ID: {selectedTransaction.processor_transaction_id || selectedTransaction.id}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                    <p className="font-medium">{selectedTransaction.currency} {parseFloat(selectedTransaction.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div>{getStatusBadge(selectedTransaction.status)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Payment Processor</h3>
                    <p className="font-medium">{selectedTransaction.payment_processors?.display_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                    <p className="font-medium">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                  </div>
                  {selectedTransaction.processed_at && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Processed At</h3>
                      <p className="font-medium">{new Date(selectedTransaction.processed_at).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedTransaction.failed_at && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Failed At</h3>
                      <p className="font-medium">{new Date(selectedTransaction.failed_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                
                {selectedTransaction.payment_method && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Method</h3>
                    <div className="bg-muted p-4 rounded-md">
                      <pre className="text-xs">
                        {JSON.stringify(selectedTransaction.payment_method, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedTransaction.processor_response && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Processor Response</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                      <pre className="text-xs">
                        {JSON.stringify(selectedTransaction.processor_response, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedTransaction.failure_reason && (
                  <div>
                    <h3 className="text-sm font-medium text-red-500 mb-2">Failure Reason</h3>
                    <div className="bg-red-50 text-red-800 p-4 rounded-md">
                      <p className="text-sm">{selectedTransaction.failure_reason}</p>
                    </div>
                  </div>
                )}
                
                {selectedTransaction.orders && (
                  <div className="flex justify-end">
                    <Button asChild variant="outline" size="sm">
                      <a href={`/admin/orders/${selectedTransaction.orders.id}`}>
                        View Related Order
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}