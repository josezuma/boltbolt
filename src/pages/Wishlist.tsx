import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useCartStore, useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type WishlistItem = {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    price: string;
    image_url: string | null;
    stock: number;
    slug: string;
    categories: { name: string } | null;
  };
};

export function Wishlist() {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            name,
            price,
            image_url,
            stock,
            slug,
            categories:category_id (name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;
      
      setWishlistItems(wishlistItems.filter(item => item.id !== wishlistId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const addToCart = (product: WishlistItem['products']) => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image_url: product.image_url || '',
      stock: product.stock
    });
    
    toast.success(`Added ${product.name} to cart`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-editorial py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h1 className="text-editorial-heading mb-4">Sign In to View Your Wishlist</h1>
              <p className="text-editorial-body text-muted-foreground mb-8">
                Please sign in to view and manage your saved items.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="btn-editorial-primary">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild className="btn-editorial-secondary">
                  <Link to="/register">Create Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-editorial py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
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
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
          <h1 className="text-editorial-heading mb-4">My Wishlist</h1>
          <p className="text-editorial-body text-muted-foreground">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <Card className="card-editorial text-center py-12">
            <CardContent>
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-4">Your Wishlist is Empty</h3>
              <p className="text-muted-foreground mb-8">
                You haven't added any items to your wishlist yet. Start browsing our products to find items you love.
              </p>
              <Button asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlistItems.map((item) => (
              <div key={item.id} className="group relative">
                <Link to={`/product/${item.products.slug}`} className="block">
                  <div className="aspect-[3/4] overflow-hidden bg-muted mb-4">
                    <img
                      src={item.products.image_url || `https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg?auto=compress&cs=tinysrgb&w=800`}
                      alt={item.products.name}
                      className="w-full h-full object-cover image-editorial-hover"
                    />
                  </div>
                </Link>
                
                <div className="space-y-2">
                  {item.products.categories && (
                    <p className="text-editorial-caption text-muted-foreground">
                      {item.products.categories.name}
                    </p>
                  )}
                  
                  <Link to={`/product/${item.products.slug}`}>
                    <h3 className="product-title-editorial text-lg">{item.products.name}</h3>
                  </Link>
                  
                  <div className="flex items-center justify-between">
                    <p className="product-price-editorial text-lg">
                      ${parseFloat(item.products.price).toFixed(2)}
                    </p>
                    {item.products.stock > 0 ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        In Stock
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={() => removeFromWishlist(item.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                    <Button
                      onClick={() => addToCart(item.products)}
                      disabled={item.products.stock === 0}
                      className="flex-1"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
                
                {/* Added date */}
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}