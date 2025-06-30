import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  CreditCard, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Globe,
  DollarSign,
  CreditCard as CardIcon,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StripeWebhookHelper } from '@/components/ui/stripe-webhook-helper';
import { supabase } from '@/lib/supabase';
import { executeQuery } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

export function EditPaymentProcessor() {
  const { processorId } = useParams<{ processorId: string }>();
  const [loading, setLoading] = useState(false);
  const [fetchingProcessor, setFetchingProcessor] = useState(true);
  const [showSecrets, setShowSecrets] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true,
    is_test_mode: true,
    configuration: {
      publishable_key: '',
      secret_key: '',
      webhook_secret: ''
    },
    supported_currencies: ['USD'],
    supported_countries: ['US'],
    supported_payment_methods: ['card']
  });

  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/admin/payment-processors');
      return;
    }
    
    if (processorId) {
      fetchPaymentProcessor(processorId);
    } else {
      navigate('/admin/payment-processors');
    }
  }, [user, isAdmin, navigate, processorId]);

  const fetchPaymentProcessor = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_processors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        toast.error('Payment processor not found');
        navigate('/admin/payment-processors');
        return;
      }
      
      setFormData({
        name: data.name,
        display_name: data.display_name,
        description: data.description || '',
        is_active: data.is_active,
        is_test_mode: data.is_test_mode,
        configuration: data.configuration || {
          publishable_key: '',
          secret_key: '',
          webhook_secret: ''
        },
        supported_currencies: data.supported_currencies || ['USD'],
        supported_countries: data.supported_countries || ['US'],
        supported_payment_methods: data.supported_payment_methods || ['card']
      });
    } catch (error) {
      console.error('Error fetching payment processor:', error);
      toast.error('Failed to load payment processor');
      navigate('/admin/payment-processors');
    } finally {
      setFetchingProcessor(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      configuration: {
        ...formData.configuration,
        [key]: value
      }
    });
  };

  const validateForm = () => {
    if (!formData.display_name.trim()) {
      toast.error('Display name is required');
      return false;
    }
    
    // For Stripe, validate keys
    if (formData.name === 'stripe') {
      const { publishable_key, secret_key } = formData.configuration;
      
      if (!publishable_key || !secret_key) {
        toast.error('Stripe requires both publishable and secret keys');
        return false;
      }

      const pubKeyPrefix = formData.is_test_mode ? 'pk_test_' : 'pk_live_';
      const secKeyPrefix = formData.is_test_mode ? 'sk_test_' : 'sk_live_';

      if (!publishable_key.startsWith(pubKeyPrefix)) {
        toast.error(`Publishable key must start with "${pubKeyPrefix}" in ${formData.is_test_mode ? 'test' : 'live'} mode`);
        return false;
      }

      if (!secret_key.startsWith(secKeyPrefix)) {
        toast.error(`Secret key must start with "${secKeyPrefix}" in ${formData.is_test_mode ? 'test' : 'live'} mode`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !processorId) {
      return;
    }

    setLoading(true);
    try {
      // Update the payment processor
      const { error } = await supabase
        .from('payment_processors')
        .update({
          display_name: formData.display_name.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active,
          is_test_mode: formData.is_test_mode,
          configuration: formData.configuration,
          supported_currencies: formData.supported_currencies,
          supported_countries: formData.supported_countries,
          supported_payment_methods: formData.supported_payment_methods
        })
        .eq('id', processorId);

      if (error) throw error;

      // If this is Stripe, also update the settings table
      if (formData.name === 'stripe') {
        const settingsToUpdate = [
          { key: 'stripe_test_mode', value: formData.is_test_mode },
          { key: 'stripe_publishable_key', value: formData.configuration.publishable_key },
          { key: 'stripe_secret_key', value: formData.configuration.secret_key },
          { key: 'stripe_webhook_secret', value: formData.configuration.webhook_secret || '' }
        ];

        try {
          await executeQuery(
            () => supabase
              .from('settings')
              .upsert(settingsToUpdate),
            'update settings'
          );
        } catch (settingsError) {
          console.error('Error updating settings:', settingsError);
          // Continue anyway as the processor was updated
        }
      }

      toast.success('Payment processor updated successfully');
      navigate('/admin/payment-processors');
    } catch (error) {
      console.error('Error updating payment processor:', error);
      toast.error('Failed to update payment processor');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProcessor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading payment processor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Payment Processor</h1>
          <p className="text-muted-foreground">Update payment processor configuration</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/payment-processors')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Configure the payment processor details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Processor ID</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Processor ID cannot be changed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name *</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      placeholder="e.g., Stripe, PayPal"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Name shown to customers
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of this payment method"
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="is_active" className="text-base">Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable this payment processor for checkout
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="is_test_mode" className="text-base">Test Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Use test credentials (no real payments)
                    </p>
                  </div>
                  <Switch
                    id="is_test_mode"
                    checked={formData.is_test_mode}
                    onCheckedChange={(checked) => handleInputChange('is_test_mode', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="configuration" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                <TabsTrigger value="currencies">Currencies & Countries</TabsTrigger>
                <TabsTrigger value="methods">Payment Methods</TabsTrigger>
              </TabsList>
              
              <TabsContent value="configuration" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                    <CardDescription>
                      Update your payment processor API credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {formData.is_test_mode && (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-700">
                          You're in test mode. No real payments will be processed.
                          Use test credentials only.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="publishable_key">
                          Publishable Key {formData.is_test_mode ? '(Test)' : '(Live)'}
                        </Label>
                        <Input
                          id="publishable_key"
                          value={formData.configuration.publishable_key || ''}
                          onChange={(e) => handleConfigChange('publishable_key', e.target.value)}
                          placeholder={formData.is_test_mode ? 'pk_test_...' : 'pk_live_...'}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secret_key">
                          Secret Key {formData.is_test_mode ? '(Test)' : '(Live)'}
                        </Label>
                        <div className="relative">
                          <Input
                            id="secret_key"
                            type={showSecrets ? 'text' : 'password'}
                            value={formData.configuration.secret_key || ''}
                            onChange={(e) => handleConfigChange('secret_key', e.target.value)}
                            placeholder={formData.is_test_mode ? 'sk_test_...' : 'sk_live_...'}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowSecrets(!showSecrets)}
                          >
                            {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="webhook_secret">
                          Webhook Secret {formData.is_test_mode ? '(Test)' : '(Live)'}
                        </Label>
                        <Input
                          id="webhook_secret"
                          type={showSecrets ? 'text' : 'password'}
                          value={formData.configuration.webhook_secret || ''}
                          onChange={(e) => handleConfigChange('webhook_secret', e.target.value)}
                          placeholder="whsec_..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Used to verify webhook signatures
                        </p>
                      </div>
                    </div>
                    
                    {/* Webhook Configuration */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-base font-medium mb-3">Webhook Configuration</h3>
                      {formData.name === 'stripe' && (
                        <StripeWebhookHelper isTestMode={formData.is_test_mode} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="currencies" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Supported Currencies
                    </CardTitle>
                    <CardDescription>
                      Select the currencies this payment processor supports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'].map((currency) => (
                        <Badge 
                          key={currency}
                          variant={formData.supported_currencies.includes(currency) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const newCurrencies = formData.supported_currencies.includes(currency)
                              ? formData.supported_currencies.filter(c => c !== currency)
                              : [...formData.supported_currencies, currency];
                            handleInputChange('supported_currencies', newCurrencies);
                          }}
                        >
                          {currency}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="w-5 h-5 mr-2" />
                      Supported Countries
                    </CardTitle>
                    <CardDescription>
                      Select the countries this payment processor supports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {['US', 'CA', 'GB', 'EU', 'AU', 'JP'].map((country) => (
                        <Badge 
                          key={country}
                          variant={formData.supported_countries.includes(country) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const newCountries = formData.supported_countries.includes(country)
                              ? formData.supported_countries.filter(c => c !== country)
                              : [...formData.supported_countries, country];
                            handleInputChange('supported_countries', newCountries);
                          }}
                        >
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="methods" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CardIcon className="w-5 h-5 mr-2" />
                      Supported Payment Methods
                    </CardTitle>
                    <CardDescription>
                      Select the payment methods this processor supports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {['card', 'apple_pay', 'google_pay', 'klarna', 'afterpay'].map((method) => (
                        <Badge 
                          key={method}
                          variant={formData.supported_payment_methods.includes(method) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const newMethods = formData.supported_payment_methods.includes(method)
                              ? formData.supported_payment_methods.filter(m => m !== method)
                              : [...formData.supported_payment_methods, method];
                            handleInputChange('supported_payment_methods', newMethods);
                          }}
                        >
                          {method.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Processor Preview</CardTitle>
                <CardDescription>
                  How this payment processor will appear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{formData.display_name || 'Payment Processor'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.description || formData.name || 'Description'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge 
                      variant={formData.is_test_mode ? "outline" : "default"}
                      className={formData.is_test_mode ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : ""}
                    >
                      {formData.is_test_mode ? 'Test Mode' : 'Live Mode'}
                    </Badge>
                    
                    <Badge 
                      variant={formData.is_active ? "default" : "secondary"}
                      className={formData.is_active ? "bg-green-100 text-green-800" : ""}
                    >
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Currencies:</span>{' '}
                      {formData.supported_currencies.join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Payment Methods:</span>{' '}
                      {formData.supported_payment_methods.map(m => m.replace('_', ' ')).join(', ')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Setup Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-4">
                  <p>
                    Follow these steps to set up your payment processor:
                  </p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Enter your API credentials from your payment processor dashboard</li>
                    <li>Configure webhook endpoints to receive payment notifications</li>
                    <li>Test the integration using test mode before going live</li>
                    <li>Switch to live mode when ready to accept real payments</li>
                  </ol>
                  <p className="text-muted-foreground mt-4">
                    Need help? Refer to the documentation for your payment processor.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}