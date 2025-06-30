import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save,
  Store,
  CreditCard,
  Truck,
  Percent,
  Mail,
  Globe,
  Palette,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

interface SettingsState {
  [key: string]: any;
}

export function Settings() {
  const { user, isAdmin } = useAuthStore();
  const [settings, setSettings] = useState<SettingsState>({
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
    currency: 'USD',
    tax_rate: 0.08,
    tax_inclusive: false,
    shipping_enabled: true,
    free_shipping_threshold: 50,
    default_shipping_rate: 5.99,
    international_shipping: false,
    inventory_tracking: true,
    low_stock_threshold: 5,
    email_notifications: true,
    order_notifications: true,
    customer_notifications: true,
    smtp_enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    store_logo: '',
    store_favicon: '',
    store_primary_color: '#2A2A2A',
    store_secondary_color: '#EAEAEA',
    store_font: 'Inter',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    analytics_enabled: false,
    google_analytics_id: '',
    facebook_pixel_id: '',
    maintenance_mode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && isAdmin()) {
      fetchSettings();
    }
  }, [user, isAdmin]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      const settingsMap = data?.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {} as SettingsState) || {};

      setSettings(prevSettings => ({
        ...prevSettings,
        ...settingsMap
      }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToUpdate = Object.entries(settings).map(([key, value]) => ({
        key,
        value
      }));

      const { error } = await supabase
        .from('settings')
        .upsert(settingsToUpdate);

      if (error) throw error;
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNestedChange = (parentKey: string, childKey: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
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
            <div className="h-64 bg-muted rounded"></div>
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
            <h1 className="text-3xl font-bold text-foreground">Store Settings</h1>
            <p className="text-muted-foreground">Configure your store preferences</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Store Information
                </CardTitle>
                <CardDescription>
                  Basic information about your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="store_name">Store Name</Label>
                    <Input
                      id="store_name"
                      value={settings.store_name || ''}
                      onChange={(e) => handleChange('store_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_email">Store Email</Label>
                    <Input
                      id="store_email"
                      type="email"
                      value={settings.store_email || ''}
                      onChange={(e) => handleChange('store_email', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="store_description">Store Description</Label>
                  <Textarea
                    id="store_description"
                    value={settings.store_description || ''}
                    onChange={(e) => handleChange('store_description', e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="store_phone">Phone Number</Label>
                    <Input
                      id="store_phone"
                      value={settings.store_phone || ''}
                      onChange={(e) => handleChange('store_phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={settings.currency || 'USD'} 
                      onValueChange={(value) => handleChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                        <SelectItem value="CAD">Canadian Dollar (C$)</SelectItem>
                        <SelectItem value="AUD">Australian Dollar (A$)</SelectItem>
                        <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="store_language">Language</Label>
                    <Select 
                      value={settings.store_language || 'en'} 
                      onValueChange={(value) => handleChange('store_language', value)}
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
                  <div>
                    <Label htmlFor="store_timezone">Timezone</Label>
                    <Select 
                      value={settings.store_timezone || 'UTC'} 
                      onValueChange={(value) => handleChange('store_timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Store Address</Label>
                  <div className="space-y-3 mt-2">
                    <Input
                      placeholder="Street Address"
                      value={settings.store_address?.street || ''}
                      onChange={(e) => handleNestedChange('store_address', 'street', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="City"
                        value={settings.store_address?.city || ''}
                        onChange={(e) => handleNestedChange('store_address', 'city', e.target.value)}
                      />
                      <Input
                        placeholder="State/Province"
                        value={settings.store_address?.state || ''}
                        onChange={(e) => handleNestedChange('store_address', 'state', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="ZIP/Postal Code"
                        value={settings.store_address?.zip || ''}
                        onChange={(e) => handleNestedChange('store_address', 'zip', e.target.value)}
                      />
                      <Select 
                        value={settings.store_address?.country || 'US'} 
                        onValueChange={(value) => handleNestedChange('store_address', 'country', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="maintenance_mode" className="text-base">Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Temporarily disable your store for maintenance
                    </p>
                  </div>
                  <Switch
                    id="maintenance_mode"
                    checked={settings.maintenance_mode === true}
                    onCheckedChange={(checked) => handleChange('maintenance_mode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payment Settings */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Settings
                </CardTitle>
                <CardDescription>
                  Configure payment methods and tax settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={settings.tax_rate * 100 || 0}
                      onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) / 100)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="tax_inclusive" className="text-base">Tax Inclusive Pricing</Label>
                      <p className="text-xs text-muted-foreground">
                        Display prices with tax included
                      </p>
                    </div>
                    <Switch
                      id="tax_inclusive"
                      checked={settings.tax_inclusive === true}
                      onCheckedChange={(checked) => handleChange('tax_inclusive', checked)}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Payment Processors</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure your payment processors in the <a href="/admin/payment-processors" className="text-primary underline">Payment Processors</a> section.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Shipping Settings */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Shipping Settings
                </CardTitle>
                <CardDescription>
                  Configure shipping options and rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="shipping_enabled" className="text-base">Enable Shipping</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable shipping options for physical products
                    </p>
                  </div>
                  <Switch
                    id="shipping_enabled"
                    checked={settings.shipping_enabled === true}
                    onCheckedChange={(checked) => handleChange('shipping_enabled', checked)}
                  />
                </div>
                
                {settings.shipping_enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="default_shipping_rate">Default Shipping Rate ($)</Label>
                        <Input
                          id="default_shipping_rate"
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.default_shipping_rate || 0}
                          onChange={(e) => handleChange('default_shipping_rate', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="free_shipping_threshold">Free Shipping Threshold ($)</Label>
                        <Input
                          id="free_shipping_threshold"
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.free_shipping_threshold || 0}
                          onChange={(e) => handleChange('free_shipping_threshold', parseFloat(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Set to 0 to disable free shipping
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="international_shipping" className="text-base">International Shipping</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable shipping to international destinations
                        </p>
                      </div>
                      <Switch
                        id="international_shipping"
                        checked={settings.international_shipping === true}
                        onCheckedChange={(checked) => handleChange('international_shipping', checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>
                  Customize your store's look and feel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="store_logo">Store Logo URL</Label>
                    <Input
                      id="store_logo"
                      type="url"
                      value={settings.store_logo || ''}
                      onChange={(e) => handleChange('store_logo', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_favicon">Favicon URL</Label>
                    <Input
                      id="store_favicon"
                      type="url"
                      value={settings.store_favicon || ''}
                      onChange={(e) => handleChange('store_favicon', e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="store_primary_color">Primary Color</Label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={settings.store_primary_color || '#2A2A2A'}
                        onChange={(e) => handleChange('store_primary_color', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300"
                      />
                      <Input
                        id="store_primary_color"
                        value={settings.store_primary_color || '#2A2A2A'}
                        onChange={(e) => handleChange('store_primary_color', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="store_secondary_color">Secondary Color</Label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={settings.store_secondary_color || '#EAEAEA'}
                        onChange={(e) => handleChange('store_secondary_color', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300"
                      />
                      <Input
                        id="store_secondary_color"
                        value={settings.store_secondary_color || '#EAEAEA'}
                        onChange={(e) => handleChange('store_secondary_color', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="store_font">Font Family</Label>
                  <Select 
                    value={settings.store_font || 'Inter'} 
                    onValueChange={(value) => handleChange('store_font', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter (Modern Sans-serif)</SelectItem>
                      <SelectItem value="Space Grotesk">Space Grotesk (Geometric)</SelectItem>
                      <SelectItem value="Poppins">Poppins (Friendly)</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display (Elegant)</SelectItem>
                      <SelectItem value="Roboto">Roboto (Clean)</SelectItem>
                      <SelectItem value="Montserrat">Montserrat (Professional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">SEO Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo_title">SEO Title</Label>
                      <Input
                        id="seo_title"
                        value={settings.seo_title || ''}
                        onChange={(e) => handleChange('seo_title', e.target.value)}
                        placeholder="Your store's SEO title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_description">SEO Description</Label>
                      <Textarea
                        id="seo_description"
                        value={settings.seo_description || ''}
                        onChange={(e) => handleChange('seo_description', e.target.value)}
                        placeholder="Brief description for search engines"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seo_keywords">SEO Keywords</Label>
                      <Input
                        id="seo_keywords"
                        value={settings.seo_keywords || ''}
                        onChange={(e) => handleChange('seo_keywords', e.target.value)}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure email and notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="email_notifications" className="text-base">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable email notifications for your store
                    </p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={settings.email_notifications === true}
                    onCheckedChange={(checked) => handleChange('email_notifications', checked)}
                  />
                </div>
                
                {settings.email_notifications && (
                  <>
                    <div className="space-y-4 pl-6 border-l-2 border-muted">
                      <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="order_notifications">Order Notifications</Label>
                        <Switch
                          id="order_notifications"
                          checked={settings.order_notifications === true}
                          onCheckedChange={(checked) => handleChange('order_notifications', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="customer_notifications">Customer Notifications</Label>
                        <Switch
                          id="customer_notifications"
                          checked={settings.customer_notifications === true}
                          onCheckedChange={(checked) => handleChange('customer_notifications', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="low_stock_notifications">Low Stock Alerts</Label>
                        <Switch
                          id="low_stock_notifications"
                          checked={settings.low_stock_notifications === true}
                          onCheckedChange={(checked) => handleChange('low_stock_notifications', checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">SMTP Settings</h3>
                      <div className="flex items-center justify-between space-x-2 mb-4">
                        <div className="flex flex-col space-y-1">
                          <Label htmlFor="smtp_enabled" className="text-base">Use Custom SMTP</Label>
                          <p className="text-xs text-muted-foreground">
                            Use your own SMTP server for sending emails
                          </p>
                        </div>
                        <Switch
                          id="smtp_enabled"
                          checked={settings.smtp_enabled === true}
                          onCheckedChange={(checked) => handleChange('smtp_enabled', checked)}
                        />
                      </div>
                      
                      {settings.smtp_enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="smtp_host">SMTP Host</Label>
                              <Input
                                id="smtp_host"
                                value={settings.smtp_host || ''}
                                onChange={(e) => handleChange('smtp_host', e.target.value)}
                                placeholder="smtp.example.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor="smtp_port">SMTP Port</Label>
                              <Input
                                id="smtp_port"
                                type="number"
                                value={settings.smtp_port || 587}
                                onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="smtp_username">SMTP Username</Label>
                              <Input
                                id="smtp_username"
                                value={settings.smtp_username || ''}
                                onChange={(e) => handleChange('smtp_username', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="smtp_password">SMTP Password</Label>
                              <Input
                                id="smtp_password"
                                type="password"
                                value={settings.smtp_password || ''}
                                onChange={(e) => handleChange('smtp_password', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="from_email">From Email</Label>
                              <Input
                                id="from_email"
                                type="email"
                                value={settings.from_email || ''}
                                onChange={(e) => handleChange('from_email', e.target.value)}
                                placeholder="noreply@yourstore.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor="from_name">From Name</Label>
                              <Input
                                id="from_name"
                                value={settings.from_name || ''}
                                onChange={(e) => handleChange('from_name', e.target.value)}
                                placeholder="Your Store Name"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}