import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroSlider } from '@/components/ui/hero-slider';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Brand = Database['public']['Tables']['brands']['Row'];

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    if (!supabase) {
      console.error('Supabase client not initialized. Please check your environment variables.');
      setLoading(false);
      return;
    }

    try {
      const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .limit(6),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .limit(6),
        supabase
          .from('brands')
          .select('*')
          .eq('is_active', true)
          .limit(5)
      ]);

      if (productsResponse.data) {
        setFeaturedProducts(productsResponse.data);
      }
      if (categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }
      if (brandsResponse.data) {
        setBrands(brandsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Featured Products Section */}
      <section className="section-editorial bg-muted">
        <div className="container-editorial">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-editorial-heading mb-6">New In</h2>
            <p className="text-editorial-body text-muted-foreground max-w-2xl mx-auto">
              The latest additions to our collection, featuring contemporary designs 
              and premium craftsmanship.
            </p>
          </div>
          
          {loading ? (
            <div className="product-grid-editorial">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-background mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-background rounded w-3/4"></div>
                    <div className="h-4 bg-background rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="product-grid-editorial">
              {featuredProducts.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className={`product-card-editorial group animate-fade-in-up animation-delay-${(index + 1) * 100}`}
                >
                  <div className="product-image-editorial">
                    <img
                      src={product.image_url || `https://images.pexels.com/photos/${4792728 + index}/pexels-photo-${4792728 + index}.jpeg?auto=compress&cs=tinysrgb&w=800`}
                      alt={product.name}
                      className="w-full h-full object-cover image-editorial-hover"
                    />
                  </div>
                  <div className="product-info-editorial">
                    <h3 className="product-title-editorial">{product.name}</h3>
                    <p className="product-price-editorial">
                      ${parseFloat(product.price).toFixed(2)}
                    </p>
                    {product.stock <= 5 && product.stock > 0 && (
                      <p className="text-destructive text-xs tracking-wide uppercase">
                        Only {product.stock} left
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          <div className="text-center mt-16">
            <Button asChild className="btn-editorial-secondary">
              <Link to="/products">
                View All Products
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-editorial bg-background">
        <div className="container-editorial">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-editorial-heading mb-6">Shop by Category</h2>
            <p className="text-editorial-body text-muted-foreground max-w-2xl mx-auto">
              Explore our carefully curated categories, each designed to elevate your style.
            </p>
          </div>
          
          {loading ? (
            <div className="grid-editorial-categories">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-muted mb-4"></div>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-editorial-categories">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className={`card-editorial-product group animate-fade-in-up animation-delay-${(index + 1) * 100}`}
                >
                  <div className="aspect-[3/4] overflow-hidden bg-muted mb-6">
                    <img
                      src={category.image_url || `https://images.pexels.com/photos/${4792728 + index}/pexels-photo-${4792728 + index}.jpeg?auto=compress&cs=tinysrgb&w=800`}
                      alt={category.name}
                      className="w-full h-full object-cover image-editorial-hover"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-editorial-subheading">{category.name}</h3>
                    {category.description && (
                      <p className="text-editorial-body text-muted-foreground text-sm">
                        {category.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* Debug info - remove in production */}
          {!loading && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Showing {categories.length} categories
            </div>
          )}
        </div>
      </section>

      {/* Brands Section */}
      <section className="section-editorial-compact bg-muted">
        <div className="container-editorial">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-editorial-heading mb-6">Our Brands</h2>
            <p className="text-editorial-body text-muted-foreground max-w-2xl mx-auto">
              Partnering with the world's most innovative and sustainable fashion brands.
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center space-x-8 lg:space-x-12">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-24 h-24 bg-background rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
              {brands.map((brand, index) => (
                <div
                  key={brand.id}
                  className={`group animate-fade-in-up animation-delay-${(index + 1) * 100}`}
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-background rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-editorial-caption text-xs sm:text-sm font-bold text-center">
                        {brand.name}
                      </span>
                    )}
                  </div>
                  <p className="text-center mt-3 text-editorial-caption text-xs sm:text-sm">
                    {brand.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-editorial-compact bg-background">
        <div className="container-editorial">
          <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
            <h2 className="text-editorial-heading mb-6">Stay Updated</h2>
            <p className="text-editorial-body text-muted-foreground mb-8">
              Subscribe to our newsletter for exclusive access to new collections, 
              styling tips, and special offers.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-muted border-0 rounded-none text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-foreground"
                required
              />
              <Button type="submit" className="btn-editorial-primary">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}