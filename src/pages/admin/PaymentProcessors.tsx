import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type PaymentProcessor = Database['public']['Tables']['payment_processors']['Row'];

export function PaymentProcessors() {
  const { user, isAdmin } = useAuthStore();
  const [processors, setProcessors] = useState<PaymentProcessor[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user && isAdmin()) {
      fetchPaymentProcessors();
    }
  }, [user, isAdmin]);

  const fetchPaymentProcessors = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_processors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcessors(data || []);
    } catch (error) {
      console.error('Error fetching payment processors:', error);
      toast.error('Failed to load payment processors');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcessor = async (processorId: string) => {
    if (!confirm('Are you sure you want to delete this payment processor?')) return;

    try {
      const { error } = await supabase
        .from('payment_processors')
        .delete()
        .eq('id', processorId);

      if (error) throw error;

      setProcessors(processors.filter(p => p.id !== processorId));
      toast.success('Payment processor deleted successfully');
    } catch (error) {
      console.error('Error deleting payment processor:', error);
      toast.error('Failed to delete payment processor');
    }
  };

  const toggleProcessorStatus = async (processorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_processors')
        .update({ is_active: !currentStatus })
        .eq('id', processorId);

      if (error) throw error;

      setProcessors(processors.map(p => 
        p.id === processorId ? { ...p, is_active: !currentStatus } : p
      ));
      
      toast.success(`Payment processor ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating payment processor status:', error);
      toast.error('Failed to update payment processor status');
    }
  };

  const toggleTestMode = async (processorId: string, currentMode: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_processors')
        .update({ is_test_mode: !currentMode })
        .eq('id', processorId);

      if (error) throw error;

      setProcessors(processors.map(p => 
        p.id === processorId ? { ...p, is_test_mode: !currentMode } : p
      ));
      
      toast.success(`Payment processor switched to ${!currentMode ? 'test' : 'live'} mode`);
    } catch (error) {
      console.error('Error updating payment processor mode:', error);
      toast.error('Failed to update payment processor mode');
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

  return (
    <div>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Processors</h1>
            <p className="text-muted-foreground">Manage your store's payment methods</p>
          </div>
          <Button asChild>
            <Link to="/admin/payment-processors/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Processor
            </Link>
          </Button>
        </div>

        {/* Payment Processors Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Processors
            </CardTitle>
            <CardDescription>
              Configure and manage your store's payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Processor</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Currencies</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No payment processors configured</p>
                          <Button 
                            className="mt-4"
                            onClick={() => {
                              setEditingProcessor(null);
                              resetForm();
                              setIsDialogOpen(true);
                            }}
                          >
                            Configure your first payment processor
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    processors.map((processor) => (
                      <TableRow key={processor.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{processor.display_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {processor.description || processor.name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={processor.is_test_mode ? "outline" : "default"}
                            className={processor.is_test_mode ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : ""}
                          >
                            {processor.is_test_mode ? 'Test' : 'Live'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {processor.is_active ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-gray-400" />
                                <span>Inactive</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(processor.supported_currencies as string[]).slice(0, 3).map((currency) => (
                              <Badge key={currency} variant="outline" className="text-xs">
                                {currency}
                              </Badge>
                            ))}
                            {(processor.supported_currencies as string[]).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(processor.supported_currencies as string[]).length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(processor.updated_at).toLocaleDateString()}
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
                                <Link to={`/admin/payment-processors/${processor.id}/edit`}>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Configure
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => toggleProcessorStatus(processor.id, processor.is_active)}
                              >
                                {processor.is_active ? (
                                  <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => toggleTestMode(processor.id, processor.is_test_mode)}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Switch to {processor.is_test_mode ? 'Live' : 'Test'} Mode
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteProcessor(processor.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
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

        {/* Help Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Payment Processor Setup Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-blue-700">
              <div>
                <h3 className="font-semibold mb-2">Setting up Stripe</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Create a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">stripe.com</a></li>
                  <li>Go to Developers → API keys in your Stripe dashboard</li>
                  <li>Copy your Publishable key and Secret key</li>
                  <li>For webhooks, create an endpoint pointing to your domain</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Setting up PayPal</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Create a PayPal Business account at <a href="https://paypal.com" target="_blank" rel="noopener noreferrer" className="underline">paypal.com</a></li>
                  <li>Go to the Developer Dashboard and create a new app</li>
                  <li>Copy your Client ID and Secret</li>
                  <li>Configure webhook notifications for payment events</li>
                </ol>
              </div>
              
              <div className="text-sm mt-4">
                <p className="font-semibold">Important:</p>
                <p>Always start with test mode enabled to verify your integration before processing real payments.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}