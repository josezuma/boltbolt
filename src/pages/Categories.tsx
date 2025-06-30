import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-editorial py-12">
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] bg-muted mb-4"></div>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-editorial py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-editorial-hero mb-6">Shop by Category</h1>
          <p className="text-editorial-body text-muted-foreground max-w-2xl mx-auto">
            Explore our carefully curated categories, each featuring premium products 
            designed for the modern lifestyle.
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card className="card-editorial text-center py-12">
            <CardContent>
              <h3 className="text-xl font-bold mb-4">No Categories Available</h3>
              <p className="text-muted-foreground mb-8">
                Categories are being updated. Please check back soon.
              </p>
              <Button asChild>
                <Link to="/products">Browse All Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="card-editorial-product group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-[3/4] overflow-hidden bg-muted mb-6 relative">
                  <img
                    src={category.image_url || `https://images.pexels.com/photos/${4792728 + index}/pexels-photo-${4792728 + index}.jpeg?auto=compress&cs=tinysrgb&w=800`}
                    alt={category.name}
                    className="w-full h-full object-cover image-editorial-hover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/90 px-6 py-3 rounded-none">
                      <span className="text-sm font-medium tracking-wide uppercase flex items-center">
                        Shop Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-editorial-subheading">{category.name}</h3>
                  {category.description && (
                    <p className="text-editorial-body text-muted-foreground text-sm leading-relaxed">
                      {category.description}
                    </p>
                  )}
                  <div className="pt-2">
                    <span className="text-editorial-caption text-primary group-hover:underline">
                      Explore Collection →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Featured Categories CTA */}
        <div className="mt-20 text-center">
          <div className="bg-muted p-12 rounded-none">
            <h2 className="text-editorial-heading mb-6">Can't Find What You're Looking For?</h2>
            <p className="text-editorial-body text-muted-foreground mb-8 max-w-2xl mx-auto">
              Browse our complete product catalog or use our search feature to find exactly what you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="btn-editorial-primary">
                <Link to="/products">Browse All Products</Link>
              </Button>
              <Button asChild className="btn-editorial-secondary">
                <Link to="/search">Search Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}