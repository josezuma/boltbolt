import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Package, 
  Image, 
  Tag, 
  DollarSign, 
  Layers,
  Plus,
  X,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];

interface ProductVariant {
  id?: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
  attributes: Record<string, string>;
}

interface ProductImage {
  id?: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_featured: boolean;
}

export function AddProduct() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([
    { image_url: '', alt_text: '', sort_order: 0, is_featured: true }
  ]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '0',
    sku: '',
    category_id: '',
    brand_id: '',
    is_active: true,
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    material: '',
    care_instructions: '',
    tags: [] as string[]
  });

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/admin/products');
      return;
    }
    
    fetchCategories();
    fetchBrands();
  }, [user, isAdmin, navigate]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to load brands');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('dimensions.')) {
      const dimensionField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      tags: tagsArray
    }));
  };

  const handleImageChange = (index: number, field: keyof ProductImage, value: any) => {
    setImages(prev => prev.map((image, i) => 
      i === index ? { ...image, [field]: value } : image
    ));
  };

  const addImage = () => {
    setImages(prev => [
      ...prev, 
      { 
        image_url: '', 
        alt_text: '', 
        sort_order: prev.length, 
        is_featured: false 
      }
    ]);
  };

  const removeImage = (index: number) => {
    if (images.length > 1) {
      const newImages = [...images];
      newImages.splice(index, 1);
      
      // Update sort orders and featured status
      const updatedImages = newImages.map((image, i) => ({
        ...image,
        sort_order: i,
        is_featured: i === 0 ? true : image.is_featured
      }));
      
      setImages(updatedImages);
    }
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const handleVariantAttributeChange = (index: number, attributeName: string, value: string) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { 
        ...variant, 
        attributes: {
          ...variant.attributes,
          [attributeName]: value
        } 
      } : variant
    ));
  };

  const addVariant = () => {
    setVariants(prev => [
      ...prev, 
      { 
        name: `Variant ${prev.length + 1}`,
        sku: '',
        price: formData.price,
        stock: 0,
        attributes: {}
      }
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return false;
    }
    
    if (!formData.price.trim() || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      toast.error('Valid price is required');
      return false;
    }
    
    if (!formData.category_id) {
      toast.error('Category is required');
      return false;
    }
    
    // Validate images
    const validImages = images.filter(img => img.image_url.trim());
    if (validImages.length === 0) {
      toast.error('At least one image URL is required');
      return false;
    }
    
    // Validate variants if enabled
    if (hasVariants && variants.length > 0) {
      for (const variant of variants) {
        if (!variant.name.trim()) {
          toast.error('All variants must have a name');
          return false;
        }
        if (!variant.price.trim() || isNaN(parseFloat(variant.price)) || parseFloat(variant.price) < 0) {
          toast.error('All variants must have a valid price');
          return false;
        }
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Create the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          stock: hasVariants ? 0 : parseInt(formData.stock) || 0,
          sku: formData.sku.trim() || null,
          category_id: formData.category_id || null,
          brand_id: formData.brand_id || null,
          is_active: formData.is_active,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          dimensions: Object.values(formData.dimensions).some(Boolean) 
            ? formData.dimensions 
            : null,
          material: formData.material.trim() || null,
          care_instructions: formData.care_instructions.trim() || null,
          tags: formData.tags.length > 0 ? formData.tags : null
        })
        .select()
        .single();

      if (productError) throw productError;
      
      // 2. Add product images
      const validImages = images.filter(img => img.image_url.trim());
      if (validImages.length > 0) {
        const imagesToInsert = validImages.map(image => ({
          product_id: product.id,
          image_url: image.image_url.trim(),
          alt_text: image.alt_text.trim() || null,
          sort_order: image.sort_order,
          is_featured: image.is_featured
        }));
        
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);
          
        if (imagesError) throw imagesError;
      }
      
      // 3. Add product variants if enabled
      if (hasVariants && variants.length > 0) {
        const variantsToInsert = variants.map(variant => ({
          product_id: product.id,
          name: variant.name.trim(),
          sku: variant.sku.trim() || null,
          price: parseFloat(variant.price),
          stock: variant.stock,
          attributes: Object.keys(variant.attributes).length > 0 ? variant.attributes : null,
          is_active: true
        }));
        
        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);
          
        if (variantsError) throw variantsError;
      }
      
      // Update the main product image if we have a featured image
      const featuredImage = validImages.find(img => img.is_featured);
      if (featuredImage) {
        // First get the ID of the featured image
        const { data: imageData } = await supabase
          .from('product_images')
          .select('id')
          .eq('product_id', product.id)
          .eq('is_featured', true)
          .single();
          
        if (imageData) {
          await supabase
            .from('products')
            .update({ 
              image_url: featuredImage.image_url,
              featured_image_id: imageData.id
            })
            .eq('id', product.id);
        }
      }
      
      toast.success('Product created successfully!');
      navigate('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product in your catalog</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/products')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="details">Additional Details</TabsTrigger>
          </TabsList>
          
          {/* Basic Info */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Basic Product Information
                </CardTitle>
                <CardDescription>
                  Enter the essential details about your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Premium Cotton T-Shirt"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="e.g., premium-cotton-t-shirt"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in the URL. Auto-generated from name, but you can customize it.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your product..."
                    rows={5}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="0.00"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="e.g., TCT-BLK-M"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      placeholder="0"
                      disabled={hasVariants}
                    />
                    {hasVariants && (
                      <p className="text-xs text-muted-foreground">
                        Stock is managed per variant when variants are enabled
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => handleInputChange('category_id', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
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
                    <Label htmlFor="brand">Brand</Label>
                    <Select 
                      value={formData.brand_id} 
                      onValueChange={(value) => handleInputChange('brand_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="is_active" className="text-base">Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Active products are visible to customers
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
                    <Label htmlFor="has_variants" className="text-base">Has Variants</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable if this product comes in multiple variations (size, color, etc.)
                    </p>
                  </div>
                  <Switch
                    id="has_variants"
                    checked={hasVariants}
                    onCheckedChange={(checked) => {
                      setHasVariants(checked);
                      if (checked && variants.length === 0) {
                        // Initialize with one variant
                        setVariants([
                          {
                            name: 'Default Variant',
                            sku: '',
                            price: formData.price,
                            stock: parseInt(formData.stock) || 0,
                            attributes: {}
                          }
                        ]);
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Images */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="w-5 h-5 mr-2" />
                  Product Images
                </CardTitle>
                <CardDescription>
                  Add images for your product. The first image will be used as the featured image.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {images.map((image, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Image {index + 1}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`featured-${index}`}
                            checked={image.is_featured}
                            onCheckedChange={(checked) => {
                              // Uncheck all other images
                              setImages(prev => prev.map((img, i) => ({
                                ...img,
                                is_featured: i === index ? checked : checked ? false : img.is_featured
                              })));
                            }}
                          />
                          <Label htmlFor={`featured-${index}`} className="text-sm">Featured</Label>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                          disabled={images.length === 1}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`image-url-${index}`}>Image URL *</Label>
                        <Input
                          id={`image-url-${index}`}
                          value={image.image_url}
                          onChange={(e) => handleImageChange(index, 'image_url', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`alt-text-${index}`}>Alt Text</Label>
                        <Input
                          id={`alt-text-${index}`}
                          value={image.alt_text}
                          onChange={(e) => handleImageChange(index, 'alt_text', e.target.value)}
                          placeholder="Descriptive text for accessibility"
                        />
                      </div>
                    </div>
                    
                    {image.image_url && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-2">Preview:</p>
                        <div className="w-32 h-32 border rounded overflow-hidden">
                          <img 
                            src={image.image_url} 
                            alt={image.alt_text || 'Product image'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/EAEAEA/CCCCCC?text=Image+Error';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImage}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Image
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Variants */}
          <TabsContent value="variants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Layers className="w-5 h-5 mr-2" />
                  Product Variants
                </CardTitle>
                <CardDescription>
                  Create different variations of your product (e.g., sizes, colors)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!hasVariants ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Variants are disabled. Enable variants in the Basic Info tab to manage multiple product variations.
                    </AlertDescription>
                  </Alert>
                ) : variants.length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Variants Added</h3>
                    <p className="text-muted-foreground mb-4">
                      Add variants for different versions of your product
                    </p>
                    <Button type="button" onClick={addVariant}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Variant
                    </Button>
                  </div>
                ) : (
                  <>
                    {variants.map((variant, index) => (
                      <div key={index} className="border p-4 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Variant {index + 1}</h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariant(index)}
                            disabled={variants.length === 1}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`variant-name-${index}`}>Variant Name *</Label>
                            <Input
                              id={`variant-name-${index}`}
                              value={variant.name}
                              onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                              placeholder="e.g., Small / Blue"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`variant-sku-${index}`}>SKU</Label>
                            <Input
                              id={`variant-sku-${index}`}
                              value={variant.sku}
                              onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                              placeholder="e.g., TCT-BLK-S"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`variant-price-${index}`}>Price *</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                              <Input
                                id={`variant-price-${index}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={variant.price}
                                onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                placeholder="0.00"
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`variant-stock-${index}`}>Stock Quantity *</Label>
                            <Input
                              id={`variant-stock-${index}`}
                              type="number"
                              min="0"
                              value={variant.stock}
                              onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value))}
                              placeholder="0"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Attributes</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`variant-color-${index}`} className="text-sm">Color</Label>
                              <Input
                                id={`variant-color-${index}`}
                                value={variant.attributes.color || ''}
                                onChange={(e) => handleVariantAttributeChange(index, 'color', e.target.value)}
                                placeholder="e.g., Blue"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`variant-size-${index}`} className="text-sm">Size</Label>
                              <Input
                                id={`variant-size-${index}`}
                                value={variant.attributes.size || ''}
                                onChange={(e) => handleVariantAttributeChange(index, 'size', e.target.value)}
                                placeholder="e.g., Small"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addVariant}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Variant
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Additional Details */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Additional Product Details
                </CardTitle>
                <CardDescription>
                  Add more information to help customers make informed decisions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Length"
                        value={formData.dimensions.length}
                        onChange={(e) => handleInputChange('dimensions.length', e.target.value)}
                      />
                      <Input
                        placeholder="Width"
                        value={formData.dimensions.width}
                        onChange={(e) => handleInputChange('dimensions.width', e.target.value)}
                      />
                      <Input
                        placeholder="Height"
                        value={formData.dimensions.height}
                        onChange={(e) => handleInputChange('dimensions.height', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={formData.material}
                      onChange={(e) => handleInputChange('material', e.target.value)}
                      placeholder="e.g., 100% Cotton"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="care_instructions">Care Instructions</Label>
                  <Textarea
                    id="care_instructions"
                    value={formData.care_instructions}
                    onChange={(e) => handleInputChange('care_instructions', e.target.value)}
                    placeholder="e.g., Machine wash cold, tumble dry low"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags.join(', ')}
                    onChange={handleTagsChange}
                    placeholder="e.g., summer, cotton, casual"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tags help customers find your products through search and filtering
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Submit Buttons (Fixed at Bottom) */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-end space-x-3 z-10">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}