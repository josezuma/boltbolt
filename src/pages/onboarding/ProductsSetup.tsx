import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Package, Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  name: string;
  description: string;
  price: string;
  stock: string;
  category_id: string;
  image_url: string;
}

export function ProductsSetup() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [products, setProducts] = useState<Product[]>([
    {
      name: '',
      description: '',
      price: '',
      stock: '',
      category_id: '',
      image_url: ''
    }
  ]);

  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/');
      return;
    }
    
    loadCategories();
  }, [user, isAdmin, navigate]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const slug = createSlug(newCategory);
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.trim(),
          slug,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setNewCategory('');
      toast.success('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const handleProductChange = (index: number, field: keyof Product, value: string) => {
    setProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    ));
  };

  const addProduct = () => {
    setProducts(prev => [...prev, {
      name: '',
      description: '',
      price: '',
      stock: '',
      category_id: '',
      image_url: ''
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    const validProducts = products.filter(p => 
      p.name.trim() && p.price.trim() && p.category_id
    );

    if (validProducts.length === 0) {
      toast.error('Please add at least one complete product');
      return;
    }

    setLoading(true);
    try {
      const productsToInsert = validProducts.map(product => ({
        name: product.name.trim(),
        slug: createSlug(product.name.trim()),
        description: product.description.trim() || null,
        price: parseFloat(product.price),
        stock: parseInt(product.stock) || 0,
        category_id: product.category_id,
        image_url: product.image_url.trim() || null,
        is_active: true
      }));

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) throw error;

      // Update settings
      await supabase
        .from('settings')
        .upsert([
          { key: 'products_added', value: true },
          { key: 'setup_step', value: 3 }
          // DO NOT set onboarding_completed here - only in FinalSetup
        ]);

      toast.success(`${validProducts.length} product(s) added successfully!`);
      navigate('/onboarding/final');
    } catch (error) {
      console.error('Error saving products:', error);
      toast.error('Failed to save products');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await supabase
        .from('settings')
        .upsert([
          { key: 'products_added', value: false },
          { key: 'setup_step', value: 3 }
          // DO NOT set onboarding_completed here - only in FinalSetup
        ]);
      
      navigate('/onboarding/final');
    } catch (error) {
      console.error('Error skipping products setup:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Your Products</h1>
            <p className="text-gray-600">
              Start building your catalog with your first products and categories
            </p>
          </div>

          {/* Categories Section */}
          <Card className="shadow-xl mb-8">
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>
                Organize your products into categories for better navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Existing Categories */}
                {categories.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Existing Categories
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Badge key={category.id} variant="secondary" className="px-3 py-1">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Category */}
                <div>
                  <Label htmlFor="new-category" className="text-sm font-medium text-gray-700 mb-2 block">
                    Add New Category
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g., Electronics, Clothing, Books"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Section */}
          <Card className="shadow-xl mb-8">
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
              <CardDescription>
                Add your first products to get started. You can always add more later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {products.map((product, index) => (
                  <div key={index} className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Product {index + 1}
                      </h3>
                      {products.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`product-name-${index}`}>Product Name *</Label>
                        <Input
                          id={`product-name-${index}`}
                          value={product.name}
                          onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                          placeholder="Enter product name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`product-category-${index}`}>Category *</Label>
                        <Select
                          value={product.category_id}
                          onValueChange={(value) => handleProductChange(index, 'category_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`product-price-${index}`}>Price *</Label>
                        <Input
                          id={`product-price-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={product.price}
                          onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`product-stock-${index}`}>Stock Quantity</Label>
                        <Input
                          id={`product-stock-${index}`}
                          type="number"
                          min="0"
                          value={product.stock}
                          onChange={(e) => handleProductChange(index, 'stock', e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`product-description-${index}`}>Description</Label>
                        <Textarea
                          id={`product-description-${index}`}
                          value={product.description}
                          onChange={(e) => handleProductChange(index, 'description', e.target.value)}
                          placeholder="Describe your product..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`product-image-${index}`}>Image URL (Optional)</Label>
                        <Input
                          id={`product-image-${index}`}
                          type="url"
                          value={product.image_url}
                          onChange={(e) => handleProductChange(index, 'image_url', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                        <p className="text-xs text-gray-500">
                          You can add product images later from your admin dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={addProduct}
                  variant="outline"
                  className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400 py-8"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Another Product
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigate('/onboarding/payment')}
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