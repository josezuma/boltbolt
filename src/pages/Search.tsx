import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Filter, X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'] & {
  categories: { name: string; slug: string } | null;
  brands: { name: string; slug: string } | null;
};

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const { addItem } = useCartStore();

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      searchProducts(query);
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [query]);

  const searchProducts = async (searchTerm: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (name, slug),
          brands:brand_id (name, slug)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Failed to search products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container-editorial py-12">
        {/* Search Header */}
        <div className="mb-12">
          <h1 className="text-editorial-heading mb-6">Search Products</h1>
          
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="search"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-14 text-lg rounded-none border-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Search Results */}
        {query && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                Search results for "{query}"
              </h2>
              {!loading && (
                <p className="text-muted-foreground">
                  {products.length} {products.length === 1 ? 'result' : 'results'} found
                </p>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-muted mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <Card className="card-editorial text-center py-12">
                <CardContent>
                  <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-4">No products found</h3>
                  <p className="text-muted-foreground mb-8">
                    We couldn't find any products matching "{query}". Try searching with different keywords.
                  </p>
                  <div className="space-y-4">
                    <Button onClick={clearSearch} variant="outline">
                      Clear Search
                    </Button>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Popular searches:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['clothing', 'accessories', 'shoes', 'bags'].map((term) => (
                          <Badge
                            key={term}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => {
                              setSearchQuery(term);
                              setSearchParams({ q: term });
                            }}
                          >
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product, index) => (
                  <div key={product.id} className="product-card-editorial group">
                    <Link to={`/product/${product.slug}`}>
                      <div className="aspect-[3/4] overflow-hidden bg-muted mb-4">
                        <img
                          src={product.image_url || `https://images.pexels.com/photos/${4792728 + index}/pexels-photo-${4792728 + index}.jpeg?auto=compress&cs=tinysrgb&w=800`}
                          alt={product.name}
                          className="w-full h-full object-cover image-editorial-hover"
                        />
                      </div>
                    </Link>
                    
                    <div className="space-y-2">
                      {product.categories && (
                        <p className="text-editorial-caption text-muted-foreground">
                          {product.brands?.name || product.categories.name}
                        </p>
                      )}
                      
                      <Link to={`/product/${product.slug}`}>
                        <h3 className="product-title-editorial text-lg">{product.name}</h3>
                      </Link>
                      
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
                      
                      <div className="flex gap-3 mt-4">
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Query State */}
        {!query && (
          <Card className="card-editorial text-center py-12">
            <CardContent>
              <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-4">Search Our Products</h3>
              <p className="text-muted-foreground mb-8">
                Enter a search term above to find products in our catalog.
              </p>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Popular searches:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['clothing', 'accessories', 'shoes', 'bags', 'premium', 'casual'].map((term) => (
                    <Badge
                      key={term}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => {
                        setSearchQuery(term);
                        setSearchParams({ q: term });
                      }}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}