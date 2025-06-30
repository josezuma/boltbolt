import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Palette, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

export function DesignSetup() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    store_logo: '',
    store_favicon: '',
    store_primary_color: '#2A2A2A',
    store_secondary_color: '#EAEAEA',
    store_font: 'Inter'
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
          'store_logo',
          'store_favicon',
          'store_primary_color',
          'store_secondary_color',
          'store_font'
        ]);

      if (settings) {
        const settingsMap = settings.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as Record<string, any>);

        setFormData(prev => ({
          ...prev,
          store_logo: settingsMap.store_logo || '',
          store_favicon: settingsMap.store_favicon || '',
          store_primary_color: settingsMap.store_primary_color || '#2A2A2A',
          store_secondary_color: settingsMap.store_secondary_color || '#EAEAEA',
          store_font: settingsMap.store_font || 'Inter'
        }));
      }
    } catch (error) {
      console.error('Error loading design settings:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const colorPresets = [
    { name: 'Classic Black', primary: '#2A2A2A', secondary: '#EAEAEA' },
    { name: 'Ocean Blue', primary: '#1E40AF', secondary: '#DBEAFE' },
    { name: 'Forest Green', primary: '#059669', secondary: '#D1FAE5' },
    { name: 'Royal Purple', primary: '#7C3AED', secondary: '#EDE9FE' },
    { name: 'Sunset Orange', primary: '#EA580C', secondary: '#FED7AA' },
    { name: 'Rose Pink', primary: '#E11D48', secondary: '#FCE7F3' }
  ];

  const fonts = [
    { value: 'Inter', label: 'Inter (Modern Sans-serif)' },
    { value: 'Space Grotesk', label: 'Space Grotesk (Geometric)' },
    { value: 'Poppins', label: 'Poppins (Friendly)' },
    { value: 'Playfair Display', label: 'Playfair Display (Elegant)' },
    { value: 'Roboto', label: 'Roboto (Clean)' },
    { value: 'Montserrat', label: 'Montserrat (Professional)' }
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const settingsToUpdate = [
        { key: 'store_logo' as any, value: formData.store_logo },
        { key: 'store_favicon' as any, value: formData.store_favicon },
        { key: 'store_primary_color' as any, value: formData.store_primary_color },
        { key: 'store_secondary_color' as any, value: formData.store_secondary_color },
        { key: 'store_font' as any, value: formData.store_font },
        { key: 'design_configured' as any, value: true },
        { key: 'setup_step' as any, value: 4 }
        // DO NOT set onboarding_completed here - only in FinalSetup
      ];

      const { error } = await supabase
        ?.from('settings')
        .upsert(settingsToUpdate);

      if (error) throw error;

      toast.success('Design settings saved successfully!');
      navigate('/onboarding/final');
    } catch (error) {
      console.error('Error saving design settings:', error);
      toast.error('Failed to save design settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await supabase
        ?.from('settings')
        .upsert([
          { key: 'design_configured' as any, value: false },
          { key: 'setup_step' as any, value: 4 }
          // DO NOT set onboarding_completed here - only in FinalSetup
        ]);
      
      navigate('/onboarding/final');
    } catch (error) {
      console.error('Error skipping design setup:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Design & Branding</h1>
            <p className="text-gray-600">
              Customize your store's appearance to match your brand
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Logo & Branding */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Logo & Branding</CardTitle>
                  <CardDescription>
                    Upload your logo and favicon to brand your store
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="store_logo">Store Logo URL</Label>
                    <Input
                      id="store_logo"
                      type="url"
                      value={formData.store_logo}
                      onChange={(e) => handleInputChange('store_logo', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-gray-500">
                      Recommended size: 200x60px (PNG or SVG)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_favicon">Favicon URL</Label>
                    <Input
                      id="store_favicon"
                      type="url"
                      value={formData.store_favicon}
                      onChange={(e) => handleInputChange('store_favicon', e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                    />
                    <p className="text-xs text-gray-500">
                      Recommended size: 32x32px (ICO or PNG)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Color Scheme */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Color Scheme</CardTitle>
                  <CardDescription>
                    Choose colors that represent your brand
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Color Presets */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            handleInputChange('store_primary_color', preset.primary);
                            handleInputChange('store_secondary_color', preset.secondary);
                          }}
                          className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex space-x-1">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: preset.secondary }}
                            />
                          </div>
                          <span className="text-xs font-medium">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={formData.store_primary_color}
                          onChange={(e) => handleInputChange('store_primary_color', e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                        <Input
                          value={formData.store_primary_color}
                          onChange={(e) => handleInputChange('store_primary_color', e.target.value)}
                          placeholder="#2A2A2A"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={formData.store_secondary_color}
                          onChange={(e) => handleInputChange('store_secondary_color', e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                        <Input
                          value={formData.store_secondary_color}
                          onChange={(e) => handleInputChange('store_secondary_color', e.target.value)}
                          placeholder="#EAEAEA"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Typography */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>
                    Select a font that matches your brand personality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select
                      value={formData.store_font}
                      onValueChange={(value) => handleInputChange('store_font', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fonts.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="space-y-6">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    See how your design choices will look
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Preview Header */}
                    <div 
                      className="p-4 border-b"
                      style={{ backgroundColor: formData.store_secondary_color }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {formData.store_logo ? (
                            <img 
                              src={formData.store_logo} 
                              alt="Logo" 
                              className="h-8 w-auto"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div 
                              className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: formData.store_primary_color }}
                            >
                              BS
                            </div>
                          )}
                          <span 
                            className="font-bold text-lg"
                            style={{ 
                              fontFamily: formData.store_font,
                              color: formData.store_primary_color 
                            }}
                          >
                            Your Store
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preview Content */}
                    <div className="p-6 bg-white">
                      <h2 
                        className="text-2xl font-bold mb-4"
                        style={{ 
                          fontFamily: formData.store_font,
                          color: formData.store_primary_color 
                        }}
                      >
                        Welcome to Your Store
                      </h2>
                      <p 
                        className="text-gray-600 mb-6"
                        style={{ fontFamily: formData.store_font }}
                      >
                        This is how your store will look with the selected design settings.
                      </p>
                      
                      <div className="space-y-4">
                        <button
                          className="px-6 py-3 rounded font-medium text-white transition-colors"
                          style={{ 
                            backgroundColor: formData.store_primary_color,
                            fontFamily: formData.store_font 
                          }}
                        >
                          Primary Button
                        </button>
                        
                        <button
                          className="px-6 py-3 rounded font-medium border transition-colors"
                          style={{ 
                            borderColor: formData.store_primary_color,
                            color: formData.store_primary_color,
                            fontFamily: formData.store_font 
                          }}
                        >
                          Secondary Button
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={() => navigate('/onboarding/products')}
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
                disabled={loading}
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