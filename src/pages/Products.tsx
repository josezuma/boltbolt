import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, ShoppingBag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { executeQuery } from '@/lib/supabase';
import { useCartStore, useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'] & {
  categories: { name: string; slug: string } | null;
  brands: { name: string; slug: string } | null;
};
type Category = Database['public']['Tables']['categories']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    // Check for category filter in URL params
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
    
    fetchCategories();
    fetchBrands();
    
    if (user) {
      fetchWishlistItems();
    }
    fetchProducts();
  }, [searchParams, selectedCategories, selectedBrands, sortBy, inStockOnly]);

  const fetchCategories = async () => {
    try {
      const data = await executeQuery(
        () => supabase!
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('name'),
        'fetch categories'
      );
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load categories');
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await executeQuery(
        () => supabase!
          .from('brands')
          .select('*')
          .eq('is_active', true)
          .order('name'),
        'fetch brands'
      );
      
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load brands');
    }
  };

  const fetchWishlistItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setWishlistItems(data.map(item => item.product_id));
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await executeQuery(
        () => {
          let query = supabase!
            .from('products')
            .select(`
              *,
              categories:category_id (name, slug),
              brands:brand_id (name, slug)
            `)
            .eq('is_active', true);

          // Apply search filter
          const searchTerm = searchParams.get('q') || searchQuery;
          if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
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
          if (inStockOnly) {
            query = query.gt('stock', 0);
          }

          // Apply sorting
          switch (sortBy) {
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

          return query;
        },
        'fetch products'
      );
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    }
  };

  const handleBrandChange = (brandId: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands([...selectedBrands, brandId]);
    } else {
      setSelectedBrands(selectedBrands.filter(id => id !== brandId));
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image_url: product.image_url || '',
      stock: product.stock
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const handleWishlistToggle = async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to add items to your wishlist');
      return;
    }

    try {
      if (wishlistItems.includes(productId)) {
        // Remove from wishlist
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        setWishlistItems(wishlistItems.filter(id => id !== productId));
        toast.success('Removed from wishlist');
      } else {
        // Add to wishlist
        await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
        setWishlistItems([...wishlistItems, productId]);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-editorial py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-editorial-hero mb-6">Products</h1>
          <p className="text-editorial-body text-muted-foreground max-w-2xl mx-auto">
            Discover our complete collection of premium fashion and lifestyle products.
          </p>
        </div>
        
        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between mb-12 pb-8 border-b border-border">
          <form onSubmit={handleSearch} className="w-full lg:flex-1 lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-muted border-0 rounded-none h-12 text-sm tracking-wide"
              />
            </div>
          </form>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 bg-muted border-0 rounded-none h-12">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border border-border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none h-12 px-4 bg-transparent hover:bg-muted"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none h-12 px-4 bg-transparent hover:bg-muted"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 space-y-8">
            <div>
              <h3 className="text-editorial-caption mb-4">Categories</h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category.id, checked as boolean)
                      }
                      className="rounded-none"
                    />
                    <label htmlFor={category.id} className="text-sm cursor-pointer">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-editorial-caption mb-4">Brands</h3>
              <div className="space-y-3">
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={brand.id}
                      checked={selectedBrands.includes(brand.id)}
                      onCheckedChange={(checked) => 
                        handleBrandChange(brand.id, checked as boolean)
                      }
                      className="rounded-none"
                    />
                    <label htmlFor={brand.id} className="text-sm cursor-pointer">
                      {brand.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-editorial-caption mb-4">Availability</h3>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="in-stock"
                  checked={inStockOnly}
                  onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
                  className="rounded-none"
                />
                <label htmlFor="in-stock" className="text-sm cursor-pointer">
                  In Stock Only
                </label>
              </div>
            </div>
          </aside>

          {/* Products Grid/List */}
          <main className="flex-1">
            {loading ? (
              <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className={`${viewMode === 'grid' ? 'aspect-[3/4]' : 'aspect-video'} bg-muted mb-4`}></div>
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-editorial-subheading mb-2">No products found</h3>
                <p className="text-editorial-body text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {products.map((product, index) => (
                  <div key={product.id} className={`product-card-editorial group ${viewMode === 'list' ? 'flex gap-6' : ''}`}>
                    <Link to={`/product/${product.slug}`} className={viewMode === 'list' ? 'w-64 flex-shrink-0' : ''}>
                      <div className={`${viewMode === 'grid' ? 'aspect-[3/4]' : 'aspect-square'} overflow-hidden bg-muted mb-4`}>
                        <img
                          src={product.image_url || `https://images.pexels.com/photos/${4792728 + index}/pexels-photo-${4792728 + index}.jpeg?auto=compress&cs=tinysrgb&w=800`}
                          alt={product.name}
                          className="w-full h-full object-cover image-editorial-hover"
                        />
                      </div>
                    </Link>
                    
                    <div className={`${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                      <div className="space-y-2">
                        {product.categories && (
                          <p className="text-editorial-caption text-muted-foreground">
                            {product.brands?.name || product.categories.name}
                          </p>
                        )}
                        
                        <Link to={`/product/${product.slug}`}>
                          <h3 className="product-title-editorial text-lg">{product.name}</h3>
                        </Link>
                        
                        {product.description && viewMode === 'list' && (
                          <p className="text-editorial-body text-muted-foreground text-sm line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <p className="product-price-editorial text-lg">
                            ${parseFloat(product.price).toFixed(2)}
                          </p>
                          {product.stock > 0 ? (
                            <span className="text-xs text-muted-foreground tracking-wide uppercase">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-xs text-destructive tracking-wide uppercase">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-6">
                        <Button
                          asChild
                          className="btn-editorial-minimal flex-1"
                        >
                          <Link to={`/product/${product.slug}`}>View</Link>
                        </Button>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className="btn-editorial-primary flex-1"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                        {user && (
                          <Button
                            onClick={() => handleWishlistToggle(product.id)}
                            variant="outline"
                            className="w-10 h-10 p-0 flex items-center justify-center"
                          >
                            <Heart className={`w-4 h-4 ${wishlistItems.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                        )}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}