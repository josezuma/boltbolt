import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CreditCard, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StripeWebhookHelper } from '@/components/ui/stripe-webhook-helper';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

export function PaymentSetup() {
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [formData, setFormData] = useState({
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    paypal_enabled: false,
    paypal_client_id: '',
    paypal_client_secret: ''
  });

  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/');
      return;
    }
    
    loadExistingSettings();
  }, [user, isAdmin, navigate]);

  const loadExistingSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'stripe_test_mode',
          'stripe_publishable_key',
          'stripe_secret_key',
          'stripe_webhook_secret',
          'paypal_enabled',
          'paypal_client_id',
          'paypal_client_secret'
        ]);

      if (settings) {
        const settingsMap = settings.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as Record<string, any>);

        setTestMode(settingsMap.stripe_test_mode !== false);
        setFormData({
          stripe_publishable_key: settingsMap.stripe_publishable_key || '',
          stripe_secret_key: settingsMap.stripe_secret_key || '',
          stripe_webhook_secret: settingsMap.stripe_webhook_secret || '',
          paypal_enabled: settingsMap.paypal_enabled === true,
          paypal_client_id: settingsMap.paypal_client_id || '',
          paypal_client_secret: settingsMap.paypal_client_secret || ''
        });
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStripeKeys = () => {
    const { stripe_publishable_key, stripe_secret_key } = formData;
    
    if (!stripe_publishable_key || !stripe_secret_key) {
      return false;
    }

    const pubKeyPrefix = testMode ? 'pk_test_' : 'pk_live_';
    const secKeyPrefix = testMode ? 'sk_test_' : 'sk_live_';

    return stripe_publishable_key.startsWith(pubKeyPrefix) && 
           stripe_secret_key.startsWith(secKeyPrefix);
  };

  const handleSave = async () => {
    if (!validateStripeKeys()) {
      toast.error('Please enter valid Stripe keys for the selected mode');
      return;
    }

    setLoading(true);
    try {
      // Update payment processor configuration
      const { data: stripeProcessor } = await supabase
        .from('payment_processors')
        .select('id')
        .eq('name', 'stripe')
        .single();

      if (stripeProcessor) {
        await supabase
          .from('payment_processors')
          .update({
            is_test_mode: testMode,
            configuration: {
              publishable_key: formData.stripe_publishable_key,
              secret_key: formData.stripe_secret_key,
              webhook_secret: formData.stripe_webhook_secret
            },
            is_active: true
          })
          .eq('id', stripeProcessor.id);
      }

      // Update settings
      const settingsToUpdate = [
        { key: 'stripe_test_mode', value: testMode },
        { key: 'stripe_publishable_key', value: formData.stripe_publishable_key },
        { key: 'stripe_secret_key', value: formData.stripe_secret_key },
        { key: 'stripe_webhook_secret', value: formData.stripe_webhook_secret },
        { key: 'paypal_enabled', value: formData.paypal_enabled },
        { key: 'paypal_client_id', value: formData.paypal_client_id },
        { key: 'paypal_client_secret', value: formData.paypal_client_secret },
        { key: 'payment_configured', value: true },
        { key: 'setup_step', value: 2 }
      ];

      const { error } = await supabase
        .from('settings')
        .upsert(settingsToUpdate);

      if (error) throw error;

      toast.success('Payment settings saved successfully!');
      navigate('/onboarding/products');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await supabase
        .from('settings')
        .upsert([
          { key: 'payment_configured', value: false },
          { key: 'setup_step', value: 2 }
        ]);
      
      navigate('/onboarding/products');
    } catch (error) {
      console.error('Error skipping payment setup:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Setup</h1>
            <p className="text-gray-600">
              Configure your payment processors to start accepting payments
            </p>
          </div>

          {/* Stripe Configuration */}
          <Card className="shadow-xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                Stripe Configuration
              </CardTitle>
              <CardDescription>
                Stripe is the recommended payment processor for secure card payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Test Mode</Label>
                  <p className="text-sm text-gray-600">
                    Use test keys for development and testing
                  </p>
                </div>
                <Switch
                  checked={testMode}
                  onCheckedChange={setTestMode}
                />
              </div>

              {testMode && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You're in test mode. No real payments will be processed. 
                    Switch to live mode when you're ready to accept real payments.
                  </AlertDescription>
                </Alert>
              )}

              {/* API Keys */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe_publishable_key">
                    Publishable Key {testMode ? '(Test)' : '(Live)'}
                  </Label>
                  <Input
                    id="stripe_publishable_key"
                    value={formData.stripe_publishable_key}
                    onChange={(e) => handleInputChange('stripe_publishable_key', e.target.value)}
                    placeholder={testMode ? 'pk_test_...' : 'pk_live_...'}
                    type={showSecrets ? 'text' : 'password'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe_secret_key">
                    Secret Key {testMode ? '(Test)' : '(Live)'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="stripe_secret_key"
                      value={formData.stripe_secret_key}
                      onChange={(e) => handleInputChange('stripe_secret_key', e.target.value)}
                      placeholder={testMode ? 'sk_test_...' : 'sk_live_...'}
                      type={showSecrets ? 'text' : 'password'}
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
                  <Label htmlFor="stripe_webhook_secret">
                    Webhook Secret (Optional)
                  </Label>
                  <Input
                    id="stripe_webhook_secret"
                    value={formData.stripe_webhook_secret}
                    onChange={(e) => handleInputChange('stripe_webhook_secret', e.target.value)}
                    placeholder="whsec_..."
                    type={showSecrets ? 'text' : 'password'}
                  />
                  <p className="text-xs text-gray-500">
                    Required for webhook verification. You can add this later.
                  </p>
                </div>
              </div>

              {/* Webhook Setup Helper */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-base font-medium mb-3">Webhook Configuration</h3>
                <StripeWebhookHelper isTestMode={testMode} />
              </div>

              {/* Validation Status */}
              {formData.stripe_publishable_key && formData.stripe_secret_key && (
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-green-50">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    {validateStripeKeys() ? 'Valid Stripe keys' : 'Invalid Stripe keys for selected mode'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PayPal Configuration */}
          <Card className="shadow-xl mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                PayPal Configuration
                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  Optional
                </span>
              </CardTitle>
              <CardDescription>
                Enable PayPal for additional payment options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable PayPal</Label>
                  <p className="text-sm text-gray-600">
                    Allow customers to pay with PayPal
                  </p>
                </div>
                <Switch
                  checked={formData.paypal_enabled}
                  onCheckedChange={(checked) => handleInputChange('paypal_enabled', checked)}
                />
              </div>

              {formData.paypal_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paypal_client_id">PayPal Client ID</Label>
                    <Input
                      id="paypal_client_id"
                      value={formData.paypal_client_id}
                      onChange={(e) => handleInputChange('paypal_client_id', e.target.value)}
                      placeholder="Your PayPal Client ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paypal_client_secret">PayPal Client Secret</Label>
                    <Input
                      id="paypal_client_secret"
                      value={formData.paypal_client_secret}
                      onChange={(e) => handleInputChange('paypal_client_secret', e.target.value)}
                      placeholder="Your PayPal Client Secret"
                      type={showSecrets ? 'text' : 'password'}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="bg-blue-50 border-blue-200 mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need help setting up Stripe?</h3>
              <p className="text-blue-700 text-sm mb-3">
                Follow these steps to get your Stripe API keys:
              </p>
              <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                <li>Create a Stripe account at stripe.com</li>
                <li>Go to Developers → API keys in your Stripe dashboard</li>
                <li>Copy your Publishable key and Secret key</li>
                <li>For webhooks, create an endpoint pointing to your domain</li>
              </ol>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigate('/onboarding/store')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex items-center"
              >
                Skip for Now
              </Button>

              <Button
                onClick={handleSave}
                disabled={loading || !validateStripeKeys()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center"
              >
                {loading ? 'Saving...' : 'Save & Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}