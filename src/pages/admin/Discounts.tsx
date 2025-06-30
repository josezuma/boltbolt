import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Tag,
  Percent,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Copy,
  ShoppingBag,
  Layers
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Discount = Database['public']['Tables']['discounts']['Row'] & {
  discount_products?: Array<{ product_id: string; products: { name: string } }>;
  discount_categories?: Array<{ category_id: string; categories: { name: string } }>;
  discount_redemptions?: Array<{ id: string }>;
};

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export function Discounts() {
  const { user, isAdmin } = useAuthStore();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    is_active: true,
    is_automatic: false,
    minimum_purchase_amount: '0',
    usage_limit: '',
    usage_limit_per_customer: '',
    starts_at: new Date().toISOString().split('T')[0],
    ends_at: '',
    applies_to_all_products: true
  });

  useEffect(() => {
    if (user && isAdmin()) {
      fetchDiscounts();
      fetchProducts();
      fetchCategories();
    }
  }, [user, isAdmin]);

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select(`
          *,
          discount_products (
            product_id,
            products (name)
          ),
          discount_categories (
            category_id,
            categories (name)
          ),
          discount_redemptions (id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      toast.error('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Discount name is required');
      return;
    }

    if (!formData.is_automatic && !formData.code.trim()) {
      toast.error('Discount code is required for non-automatic discounts');
      return;
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    try {
      // Format dates properly
      const formattedData = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        minimum_purchase_amount: parseFloat(formData.minimum_purchase_amount) || 0,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        usage_limit_per_customer: formData.usage_limit_per_customer ? parseInt(formData.usage_limit_per_customer) : null,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : new Date().toISOString(),
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        code: formData.is_automatic ? null : formData.code.trim().toUpperCase()
      };
      
      if (editingDiscount) {
        // Update existing discount
        const { error } = await supabase
          .from('discounts')
          .update(formattedData)
          .eq('id', editingDiscount.id);

        if (error) throw error;

        // Handle product associations if not applying to all products
        if (!formData.applies_to_all_products) {
          // First delete existing associations
          await supabase
            .from('discount_products')
            .delete()
            .eq('discount_id', editingDiscount.id);
          
          // Then add new ones
          if (selectedProducts.length > 0) {
            const productAssociations = selectedProducts.map(productId => ({
              discount_id: editingDiscount.id,
              product_id: productId
            }));
            
            const { error: productsError } = await supabase
              .from('discount_products')
              .insert(productAssociations);
            
            if (productsError) throw productsError;
          }

          // Handle category associations
          await supabase
            .from('discount_categories')
            .delete()
            .eq('discount_id', editingDiscount.id);
          
          if (selectedCategories.length > 0) {
            const categoryAssociations = selectedCategories.map(categoryId => ({
              discount_id: editingDiscount.id,
              category_id: categoryId
            }));
            
            const { error: categoriesError } = await supabase
              .from('discount_categories')
              .insert(categoryAssociations);
            
            if (categoriesError) throw categoriesError;
          }
        }

        toast.success('Discount updated successfully');
      } else {
        // Create new discount
        const { data, error } = await supabase
          .from('discounts')
          .insert([formattedData])
          .select();

        if (error) throw error;

        // Handle product associations if not applying to all products
        if (!formData.applies_to_all_products && data && data.length > 0) {
          const discountId = data[0].id;
          
          // Add product associations
          if (selectedProducts.length > 0) {
            const productAssociations = selectedProducts.map(productId => ({
              discount_id: discountId,
              product_id: productId
            }));
            
            const { error: productsError } = await supabase
              .from('discount_products')
              .insert(productAssociations);
            
            if (productsError) throw productsError;
          }

          // Add category associations
          if (selectedCategories.length > 0) {
            const categoryAssociations = selectedCategories.map(categoryId => ({
              discount_id: discountId,
              category_id: categoryId
            }));
            
            const { error: categoriesError } = await supabase
              .from('discount_categories')
              .insert(categoryAssociations);
            
            if (categoriesError) throw categoriesError;
          }
        }

        toast.success('Discount created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
      toast.error('Failed to save discount');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      is_active: true,
      is_automatic: false,
      minimum_purchase_amount: '0',
      usage_limit: '',
      usage_limit_per_customer: '',
      starts_at: new Date().toISOString().split('T')[0],
      ends_at: '',
      applies_to_all_products: true
    });
    setSelectedProducts([]);
    setSelectedCategories([]);
    setEditingDiscount(null);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    
    // Format dates for input fields
    const startsAt = discount.starts_at ? new Date(discount.starts_at).toISOString().split('T')[0] : '';
    const endsAt = discount.ends_at ? new Date(discount.ends_at).toISOString().split('T')[0] : '';
    
    setFormData({
      name: discount.name,
      description: discount.description || '',
      code: discount.code || '',
      discount_type: discount.discount_type,
      discount_value: discount.discount_value.toString(),
      is_active: discount.is_active,
      is_automatic: discount.is_automatic,
      minimum_purchase_amount: discount.minimum_purchase_amount.toString(),
      usage_limit: discount.usage_limit?.toString() || '',
      usage_limit_per_customer: discount.usage_limit_per_customer?.toString() || '',
      starts_at: startsAt,
      ends_at: endsAt,
      applies_to_all_products: discount.applies_to_all_products
    });

    // Set selected products and categories
    if (discount.discount_products) {
      setSelectedProducts(discount.discount_products.map(dp => dp.product_id));
    }
    
    if (discount.discount_categories) {
      setSelectedCategories(discount.discount_categories.map(dc => dc.category_id));
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (discountId: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;

    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountId);

      if (error) throw error;

      setDiscounts(discounts.filter(d => d.id !== discountId));
      toast.success('Discount deleted successfully');
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error('Failed to delete discount');
    }
  };

  const toggleDiscountStatus = async (discountId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('discounts')
        .update({ is_active: !currentStatus })
        .eq('id', discountId);

      if (error) throw error;

      setDiscounts(discounts.map(d => 
        d.id === discountId ? { ...d, is_active: !currentStatus } : d
      ));
      
      toast.success(`Discount ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating discount status:', error);
      toast.error('Failed to update discount status');
    }
  };

  const copyDiscountCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Discount code copied to clipboard');
  };

  const formatDiscountValue = (discount: Discount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.discount_value}%`;
    } else {
      return `$${parseFloat(discount.discount_value).toFixed(2)}`;
    }
  };

  const isDiscountActive = (discount: Discount) => {
    const now = new Date();
    const startsAt = discount.starts_at ? new Date(discount.starts_at) : null;
    const endsAt = discount.ends_at ? new Date(discount.ends_at) : null;
    
    return discount.is_active && 
           (!startsAt || now >= startsAt) && 
           (!endsAt || now <= endsAt);
  };

  const getDiscountStatus = (discount: Discount) => {
    if (!discount.is_active) {
      return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    }
    
    const now = new Date();
    const startsAt = discount.starts_at ? new Date(discount.starts_at) : null;
    const endsAt = discount.ends_at ? new Date(discount.ends_at) : null;
    
    if (startsAt && now < startsAt) {
      return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (endsAt && now > endsAt) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const filteredDiscounts = discounts.filter(discount =>
    discount.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (discount.code && discount.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (discount.description && discount.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            <h1 className="text-3xl font-bold text-foreground">Discounts & Coupons</h1>
            <p className="text-muted-foreground">Create and manage promotional discounts</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingDiscount(null);
                resetForm();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Discount
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
                </DialogTitle>
                <DialogDescription>
                  {editingDiscount 
                    ? 'Update the discount information below.'
                    : 'Create a new discount or coupon code for your customers.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <Tabs defaultValue="basic" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="conditions">Conditions</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="name">Discount Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Summer Sale 20% Off"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe this discount"
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="is_automatic" className="text-base">Automatic Discount</Label>
                        <p className="text-xs text-muted-foreground">
                          Apply this discount automatically without a code
                        </p>
                      </div>
                      <Switch
                        id="is_automatic"
                        checked={formData.is_automatic}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_automatic: checked })}
                      />
                    </div>
                    
                    {!formData.is_automatic && (
                      <div>
                        <Label htmlFor="code">Discount Code *</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., SUMMER20"
                          required={!formData.is_automatic}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Customers will enter this code at checkout
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount_type">Discount Type *</Label>
                        <Select 
                          value={formData.discount_type} 
                          onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="discount_value">
                          {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                        </Label>
                        <Input
                          id="discount_value"
                          type="number"
                          min="0"
                          step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                          value={formData.discount_value}
                          onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="is_active" className="text-base">Active</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable or disable this discount
                        </p>
                      </div>
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="conditions" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="minimum_purchase_amount">Minimum Purchase Amount ($)</Label>
                      <Input
                        id="minimum_purchase_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.minimum_purchase_amount}
                        onChange={(e) => setFormData({ ...formData, minimum_purchase_amount: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum order subtotal required (0 for no minimum)
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="usage_limit">Total Usage Limit</Label>
                        <Input
                          id="usage_limit"
                          type="number"
                          min="0"
                          value={formData.usage_limit}
                          onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                          placeholder="Unlimited"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum number of times this discount can be used
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="usage_limit_per_customer">Usage Limit Per Customer</Label>
                        <Input
                          id="usage_limit_per_customer"
                          type="number"
                          min="0"
                          value={formData.usage_limit_per_customer}
                          onChange={(e) => setFormData({ ...formData, usage_limit_per_customer: e.target.value })}
                          placeholder="Unlimited"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum times each customer can use this discount
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="starts_at">Start Date</Label>
                        <Input
                          id="starts_at"
                          type="date"
                          value={formData.starts_at}
                          onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ends_at">End Date</Label>
                        <Input
                          id="ends_at"
                          type="date"
                          value={formData.ends_at}
                          onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                          placeholder="No end date"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="products" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="applies_to_all_products" className="text-base">Apply to All Products</Label>
                        <p className="text-xs text-muted-foreground">
                          Apply this discount to all products in your store
                        </p>
                      </div>
                      <Switch
                        id="applies_to_all_products"
                        checked={formData.applies_to_all_products}
                        onCheckedChange={(checked) => setFormData({ ...formData, applies_to_all_products: checked })}
                      />
                    </div>
                    
                    {!formData.applies_to_all_products && (
                      <>
                        <div>
                          <Label className="mb-2 block">Select Products</Label>
                          <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                            {products.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No products available</p>
                            ) : (
                              <div className="space-y-2">
                                {products.map((product) => (
                                  <div key={product.id} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`product-${product.id}`}
                                      checked={selectedProducts.includes(product.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedProducts([...selectedProducts, product.id]);
                                        } else {
                                          setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                        }
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <label htmlFor={`product-${product.id}`} className="text-sm">
                                      {product.name} - ${parseFloat(product.price).toFixed(2)}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">Select Categories</Label>
                          <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                            {categories.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No categories available</p>
                            ) : (
                              <div className="space-y-2">
                                {categories.map((category) => (
                                  <div key={category.id} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`category-${category.id}`}
                                      checked={selectedCategories.includes(category.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedCategories([...selectedCategories, category.id]);
                                        } else {
                                          setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                                        }
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <label htmlFor={`category-${category.id}`} className="text-sm">
                                      {category.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
                
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingDiscount ? 'Update' : 'Create'} Discount
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search discounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Discounts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              All Discounts ({filteredDiscounts.length})
            </CardTitle>
            <CardDescription>
              Manage your store's discounts and promotions
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
                    <TableHead>Discount</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <Tag className="w-12 h-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No discounts found</p>
                          <Button 
                            className="mt-4"
                            onClick={() => {
                              setEditingDiscount(null);
                              resetForm();
                              setIsDialogOpen(true);
                            }}
                          >
                            Create your first discount
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDiscounts.map((discount) => {
                      const status = getDiscountStatus(discount);
                      const redemptionsCount = discount.discount_redemptions?.length || 0;
                      
                      return (
                        <TableRow key={discount.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                {discount.discount_type === 'percentage' ? (
                                  <Percent className="w-5 h-5 text-primary-foreground" />
                                ) : (
                                  <DollarSign className="w-5 h-5 text-primary-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{discount.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {discount.description || 
                                   (discount.is_automatic ? 'Automatic discount' : 'Coupon code')}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {discount.is_automatic ? (
                              <Badge variant="outline">Automatic</Badge>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                  {discount.code}
                                </code>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyDiscountCode(discount.code || '')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatDiscountValue(discount)}
                            </span>
                            {discount.minimum_purchase_amount > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Min. ${parseFloat(discount.minimum_purchase_amount).toFixed(2)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                              <span>{redemptionsCount}</span>
                            </div>
                            {discount.usage_limit && (
                              <p className="text-xs text-muted-foreground">
                                Limit: {redemptionsCount}/{discount.usage_limit}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span>
                                  {new Date(discount.starts_at).toLocaleDateString()}
                                </span>
                              </div>
                              {discount.ends_at && (
                                <div className="flex items-center space-x-1 text-muted-foreground">
                                  <span>to</span>
                                  <span>
                                    {new Date(discount.ends_at).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(discount)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => toggleDiscountStatus(discount.id, discount.is_active)}
                                >
                                  {discount.is_active ? (
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
                                {!discount.is_automatic && discount.code && (
                                  <DropdownMenuItem onClick={() => copyDiscountCode(discount.code || '')}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Code
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(discount.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
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