import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, 
  Package, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight,
  SlidersHorizontal, X, Check, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'] & {
  categories: { name: string } | null;
  brands: { name: string } | null;
  product_variants?: Array<{ id: string; name: string; price: string; stock: number }>;
};

type Category = Database['public']['Tables']['categories']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];

export function Products() {
  const { user, isAdmin } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Sorting
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  
  // Bulk actions
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Filter visibility
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user && isAdmin()) {
      fetchProducts();
      fetchCategories();
      fetchBrands();
    }
  }, [user, isAdmin, currentPage, productsPerPage, sortField, sortDirection]);
  
  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
    fetchProducts();
  }, [selectedCategories, selectedBrands, stockFilter, statusFilter, searchQuery]);
  
  useEffect(() => {
    // Update selectAll state when all visible products are selected
    if (products.length > 0 && selectedProducts.length === products.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedProducts, products]);

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
      toast.error('Failed to load categories');
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Failed to load brands');
    }
  };

  const fetchProducts = async () => {
    try {
      // First get the total count for pagination
      let countQuery = supabase
        .from('products')
        .select('id', { count: 'exact', head: true });
      
      // Apply filters to count query
      countQuery = applyFiltersToQuery(countQuery);
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      setTotalCount(count || 0);
      
      // Now fetch the actual products with pagination
      let query = supabase
        .from('products')
        .select(`
          *,
          categories:category_id (name, slug),
          brands:brand_id (name, slug),
          product_variants (id, name, price, stock)
        `);

      // Apply filters
      query = applyFiltersToQuery(query);
      
      // Apply sorting
      switch (sortField) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
        default:
          query = query.order('name', { ascending: true });
          break;
      }
      
      // Apply pagination
      const from = (currentPage - 1) * productsPerPage;
      const to = from + productsPerPage - 1;
      query = query.range(from, to);
      
      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersToQuery = (query: any) => {
    // Apply search filter
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      query = query.in('category_id', selectedCategories);
    }
    
    // Apply brand filter
    if (selectedBrands.length > 0) {
      query = query.in('brand_id', selectedBrands);
    }
    
    // Apply stock filter
    if (stockFilter === 'in_stock') {
      query = query.gt('stock', 0);
    } else if (stockFilter === 'out_of_stock') {
      query = query.eq('stock', 0);
    } else if (stockFilter === 'low_stock') {
      query = query.gt('stock', 0).lte('stock', 10);
    }
    
    // Apply status filter
    if (statusFilter === 'active') {
      query = query.eq('is_active', true);
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false);
    }
    
    return query;
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.length === 0) {
      toast.error('No products selected');
      return;
    }
    
    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      return;
    }
    
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('products')
          .delete()
          .in('id', selectedProducts);
          
        if (error) throw error;
        
        toast.success(`${selectedProducts.length} products deleted successfully`);
      } else {
        const { error } = await supabase
          .from('products')
          .update({ is_active: action === 'activate' })
          .in('id', selectedProducts);
          
        if (error) throw error;
        
        toast.success(`${selectedProducts.length} products ${action === 'activate' ? 'activated' : 'deactivated'} successfully`);
      }
      
      // Clear selection and refresh products
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Failed to ${action} products`);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (perPage: number) => {
    setProductsPerPage(perPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setStockFilter('all');
    setStatusFilter('all');
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ));
      
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    } else if (stock <= 10) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / productsPerPage);
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * productsPerPage + 1;
  const showingTo = Math.min(currentPage * productsPerPage, totalCount);

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
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
            {selectedProducts.length > 0 && (
              <div className="mt-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-800">
                  {selectedProducts.length} products selected
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {selectedProducts.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                    <X className="w-4 h-4 mr-2" />
                    Deactivate Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleBulkAction('delete')}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <Button asChild>
              <Link to="/admin/products/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "bg-muted" : ""}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Select value={`${productsPerPage}`} onValueChange={(value) => handlePerPageChange(parseInt(value))}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="10 per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Categories</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedCategories.length > 0 
                          ? `${selectedCategories.length} selected` 
                          : "All Categories"}
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <div className="p-2 max-h-[300px] overflow-auto">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                            <Checkbox 
                              id={`category-${category.id}`}
                              checked={selectedCategories.includes(category.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCategories([...selectedCategories, category.id]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                                }
                              }}
                            />
                            <label 
                              htmlFor={`category-${category.id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Brand Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Brands</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedBrands.length > 0 
                          ? `${selectedBrands.length} selected` 
                          : "All Brands"}
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <div className="p-2 max-h-[300px] overflow-auto">
                        {brands.map((brand) => (
                          <div key={brand.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                            <Checkbox 
                              id={`brand-${brand.id}`}
                              checked={selectedBrands.includes(brand.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedBrands([...selectedBrands, brand.id]);
                                } else {
                                  setSelectedBrands(selectedBrands.filter(id => id !== brand.id));
                                }
                              }}
                            />
                            <label 
                              htmlFor={`brand-${brand.id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {brand.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Stock Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Stock Status</label>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Stock Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock Status</SelectItem>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="low_stock">Low Stock (≤ 10)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Clear Filters Button */}
                <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-2">
                  <Button 
                    variant="ghost" 
                    onClick={clearFilters}
                    className="text-sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              All Products ({totalCount})
            </CardTitle>
            <CardDescription>
              Manage your product inventory and details
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
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectAll} 
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all products"
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSortChange('sku')}
                      >
                        SKU
                        {sortField === 'sku' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 inline" /> : <ArrowDown className="ml-2 h-4 w-4 inline" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSortChange('category_id')}
                      >
                        Category
                        {sortField === 'category_id' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 inline" /> : <ArrowDown className="ml-2 h-4 w-4 inline" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSortChange('stock')}
                      >
                        Stock
                        {sortField === 'stock' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 inline" /> : <ArrowDown className="ml-2 h-4 w-4 inline" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        className="p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSortChange('price')}
                      >
                        Price
                        {sortField === 'price' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4 inline" /> : <ArrowDown className="ml-2 h-4 w-4 inline" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <Package className="w-12 h-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No products found</p>
                          <Button asChild className="mt-4">
                            <Link to="/admin/products/new">Add your first product</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => {
                      const stockStatus = getStockStatus(product.stock);
                      const StockIcon = stockStatus.icon;
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                              aria-label={`Select ${product.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                {product.image_url ? (
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {product.brands?.name || 'No brand'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm">{product.sku || 'N/A'}</code>
                          </TableCell>
                          <TableCell>
                            {product.categories?.name || 'Uncategorized'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <StockIcon className="w-4 h-4" />
                              <span>{product.stock}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              ${parseFloat(product.price).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={product.is_active ? "default" : "secondary"}
                              className={product.is_active ? "bg-green-100 text-green-800" : ""}
                            >
                              {product.is_active ? (
                                <span className="flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <X className="w-3 h-3 mr-1" />
                                  Inactive
                                </span>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.product_variants && product.product_variants.length > 0 ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {product.product_variants.length} variants
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">No variants</span>
                            )}
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
                                  <Link to={`/product/${product.slug}`}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/products/${product.id}/edit`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => toggleProductStatus(product.id, product.is_active)}
                                >
                                  {product.is_active ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteProduct(product.id)}
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {showingFrom} to {showingTo} of {totalCount} products
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-9 h-9"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="text-muted-foreground">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className="w-9 h-9"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}