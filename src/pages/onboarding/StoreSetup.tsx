import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Store, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

export function StoreSetup() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
    store_email: '',
    store_phone: '',
    store_address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    },
    store_timezone: 'UTC',
    store_language: 'en',
    currency: 'USD'
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
        ?.from('settings')
        .select('key, value')
        .in('key', [
          'store_name' as any,
          'store_description' as any, 
          'store_email' as any,
          'store_phone' as any,
          'store_address' as any,
          'store_timezone' as any,
          'store_language' as any,
          'currency' as any
        ]);

      if (settings) {
        const settingsMap = settings.reduce((acc: Record<string, any>, setting: any) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {});

        setFormData(prev => ({
          ...prev,
          store_name: settingsMap.store_name || '',
          store_description: settingsMap.store_description || '',
          store_email: settingsMap.store_email || '',
          store_phone: settingsMap.store_phone || '',
          store_address: settingsMap.store_address || prev.store_address,
          store_timezone: settingsMap.store_timezone || 'UTC',
          store_language: settingsMap.store_language || 'en',
          currency: settingsMap.currency || 'USD'
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('store_address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        store_address: {
          ...prev.store_address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.store_name.trim()) {
      toast.error('Store name is required');
      return;
    }

    setLoading(true);
    try {
      const settingsToUpdate = [
        { key: 'store_name' as any, value: formData.store_name },
        { key: 'store_description' as any, value: formData.store_description },
        { key: 'store_email' as any, value: formData.store_email },
        { key: 'store_phone' as any, value: formData.store_phone },
        { key: 'store_address' as any, value: formData.store_address },
        { key: 'store_timezone' as any, value: formData.store_timezone },
        { key: 'store_language' as any, value: formData.store_language },
        { key: 'currency' as any, value: formData.currency },
        { key: 'store_configured' as any, value: true },
        { key: 'setup_step' as any, value: 1 }
        // DO NOT set onboarding_completed here - only in FinalSetup
      ];

      const { error } = await supabase
        ?.from('settings')
        .upsert(settingsToUpdate);

      if (error) throw error;

      toast.success('Store information saved successfully!');
      navigate('/onboarding/payment');
    } catch (error) {
      console.error('Error saving store settings:', error);
      toast.error('Failed to save store settings');
    } finally {
      setLoading(false);
    }
  };

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
  ];

  const countries = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'IT', label: 'Italy' },
    { value: 'ES', label: 'Spain' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'JP', label: 'Japan' }
  ];

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Information</h1>
            <p className="text-gray-600">
              Let's start by setting up your basic store information
            </p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                This information will be displayed to your customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Store Name */}
              <div className="space-y-2">
                <Label htmlFor="store_name">Store Name *</Label>
                <Input
                  id="store_name"
                  value={formData.store_name}
                  onChange={(e) => handleInputChange('store_name', e.target.value)}
                  placeholder="My Awesome Store"
                  required
                />
              </div>

              {/* Store Description */}
              <div className="space-y-2">
                <Label htmlFor="store_description">Store Description</Label>
                <Textarea
                  id="store_description"
                  value={formData.store_description}
                  onChange={(e) => handleInputChange('store_description', e.target.value)}
                  placeholder="Describe what your store sells..."
                  rows={3}
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store_email">Email Address</Label>
                  <Input
                    id="store_email"
                    type="email"
                    value={formData.store_email}
                    onChange={(e) => handleInputChange('store_email', e.target.value)}
                    placeholder="hello@mystore.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_phone">Phone Number</Label>
                  <Input
                    id="store_phone"
                    value={formData.store_phone}
                    onChange={(e) => handleInputChange('store_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <Label className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Business Address
                </Label>
                
                <div className="space-y-3">
                  <Input
                    value={formData.store_address.street}
                    onChange={(e) => handleInputChange('store_address.street', e.target.value)}
                    placeholder="Street Address"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={formData.store_address.city}
                      onChange={(e) => handleInputChange('store_address.city', e.target.value)}
                      placeholder="City"
                    />
                    <Input
                      value={formData.store_address.state}
                      onChange={(e) => handleInputChange('store_address.state', e.target.value)}
                      placeholder="State/Province"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={formData.store_address.zip}
                      onChange={(e) => handleInputChange('store_address.zip', e.target.value)}
                      placeholder="ZIP/Postal Code"
                    />
                    <Select
                      value={formData.store_address.country}
                      onValueChange={(value) => handleInputChange('store_address.country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Regional Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={formData.store_timezone}
                    onValueChange={(value) => handleInputChange('store_timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={formData.store_language}
                    onValueChange={(value) => handleInputChange('store_language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={() => navigate('/onboarding')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleSave}
              disabled={loading || !formData.store_name.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center"
            >
              {loading ? 'Saving...' : 'Save & Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}