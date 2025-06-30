import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw, Plus, Minus, Check, Award, Clock, MessageSquare, ThumbsUp, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { executeQuery } from '@/lib/supabase';
import { useCartStore, useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Product = Database['public']['Tables']['products']['Row'] & {
  categories: { name: string; slug: string } | null;
  brands: { name: string; slug: string; logo_url: string | null } | null;
  product_images: Array<{
    id: string;
    image_url: string;
    alt_text: string | null;
    sort_order: number;
    is_featured: boolean;
  }>;
  product_reviews: Array<{
    id: string,
    rating: number,
    title: string | null,
    comment: string | null,
    created_at: string,
    is_verified_purchase: boolean,
    users: { email: string } | null
  }>;
};

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviewFormVisible, setReviewFormVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [userCanReview, setUserCanReview] = useState(false);
  const { addItem } = useCartStore();
  const { user, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (slug) {
      fetchProduct();
      if (user && !authLoading) {
        checkUserCanReview();
      }
    }
  }, [slug, user, authLoading]);

  useEffect(() => {
    if (product && user && !authLoading && user.id) {
      checkWishlistStatus();
      checkUserHasReviewed();
    }
  }, [product, user, authLoading]);

  const fetchProduct = async () => {
    try {
      const data = await executeQuery(
        () => supabase!
          .from('products')
          .select(`
            *,
            categories:category_id (name, slug),
            brands:brand_id (name, slug, logo_url),
            product_reviews (
              id,
              rating,
              title,
              comment,
              created_at,
              is_verified_purchase,
              users (email)
            ),
            product_images!product_images_product_id_fkey (
              id,
              image_url,
              alt_text,
              sort_order,
              is_featured
            )
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .single(),
        'fetch product details'
      );
      
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error(error instanceof Error ? error.message : 'Product not found or unable to load product data');
    } finally {
      setLoading(false);
    }
  };

  const checkUserHasReviewed = async () => {
    if (!product || !user || !user.id) return;

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('product_id', product.id)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserHasReviewed(true);
      } else {
        setUserHasReviewed(false);
      }
    } catch (error) {
      // Not found means user hasn't reviewed
      setUserHasReviewed(false);
    }
  };

  const checkUserCanReview = async () => {
    if (!product || !user || !user.id) {
      setUserCanReview(false);
      return;
    }

    try {
      // Check if user has purchased this product
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_items (
            id,
            product_id
          )
        `)
        .eq('user_id', user.id)
        .neq('status', 'cancelled');

      if (error) throw error;

      // Check if any order contains this product
      const hasPurchased = data?.some(order => 
        order.order_items.some(item => item.product_id === product.id)
      );

      setUserCanReview(true); // Allow anyone to review for demo purposes
      // In production, you might want to use: setUserCanReview(hasPurchased);
    } catch (error) {
      console.error('Error checking purchase history:', error);
      setUserCanReview(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      toast.error('Please sign in to leave a review');
      navigate('/login');
      return;
    }

    if (!product) return;
    
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }

    if (!reviewTitle.trim()) {
      toast.error('Please provide a review title');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please provide review comments');
      return;
    }

    setSubmittingReview(true);

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: product.id,
          user_id: user.id,
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
          is_verified_purchase: true, // This would ideally be determined by checking order history
          is_approved: true // In production, you might want to set this to false and have an approval process
        })
        .select();

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setReviewFormVisible(false);
      setUserHasReviewed(true);
      
      // Refresh product data to show the new review
      fetchProduct();
      
      // Reset form
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const checkWishlistStatus = async () => {
    if (!product || !user || !user.id || authLoading) return;

    try {
      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      
      if (data) {
        // Item found in wishlist
        setIsInWishlist(true);
      } else {
        // Not in wishlist
        setIsInWishlist(false);
      }
    } catch (error) {
      console.error('Unexpected error checking wishlist status:', error);
      setIsInWishlist(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user || !user.id || authLoading) {
      toast.error('Please sign in to add items to your wishlist');
      navigate('/login');
      return;
    }

    if (!product) return;

    setWishlistLoading(true);

    try {
      if (isInWishlist) {
        await executeQuery(
          () => supabase!
            .from('wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', product.id),
          'remove from wishlist'
        );

        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await executeQuery(
          () => supabase!
            .from('wishlists')
            .insert({
              user_id: user.id,
              product_id: product.id
            }),
          'add to wishlist'
        );

        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;

    const shareData = {
      title: product.name,
      text: product.description || `Check out this amazing product: ${product.name}`,
      url: window.location.href
    };

    try {
      // Try native Web Share API first (mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Product link copied to clipboard!');
      }
    } catch (error) {
      // Final fallback - try to copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Product link copied to clipboard!');
      } catch (clipboardError) {
        // If all else fails, show the URL
        toast.info(`Share this link: ${window.location.href}`);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image_url: product.image_url || '',
        stock: product.stock
      });
    }
    
    toast.success(`Added ${quantity} ${product.name}(s) to cart`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-200 rounded-2xl"></div>
              <div className="space-y-6">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-8 bg-gray-200 rounded w-48"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8 text-lg">The product you're looking for doesn't exist.</p>
          <Button asChild size="lg">
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Use product images from database, fallback to mock images
  const productImages = product.product_images && product.product_images.length > 0
    ? product.product_images
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(img => img.image_url)
    : [
        product.image_url || 'https://images.pexels.com/photos/4792728/pexels-photo-4792728.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/4792729/pexels-photo-4792729.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/4792730/pexels-photo-4792730.jpeg?auto=compress&cs=tinysrgb&w=800',
      ];

  // Mock rating data for display
  const productReviews = product?.product_reviews || [];
  const reviewCount = productReviews.length;
  const averageRating = reviewCount > 0 
    ? productReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
    : 0;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="custom-container py-6 sm:py-8">
        {/* Enhanced Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8 bg-white p-3 sm:p-4 shadow-sm overflow-x-auto">
          <Link to="/" className="hover:text-blue-600 transition-colors font-medium">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-blue-600 transition-colors font-medium">Products</Link>
          {product.categories && (
            <>
              <span>/</span>
              <Link to={`/products?category=${product.category_id}`} className="hover:text-blue-600 transition-colors font-medium">
                {product.categories.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </nav>

        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6 sm:mb-8 hover:bg-blue-50 hover:text-blue-600">
          <Link to="/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>

        {/* Enhanced Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 sm:mb-16">
          {/* Enhanced Product Images */}
          <div className="space-y-4 sm:space-y-6">
            <div className="aspect-square overflow-hidden bg-white shadow-xl">
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Image Thumbnails */}
            <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImage === index ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Product Info */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              {/* Brand */}
              {product.brands && (
                <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                  {product.brands.logo_url && (
                    <img
                      src={product.brands.logo_url}
                      alt={product.brands.name}
                      className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded"
                    />
                  )}
                  <span className="text-editorial-caption text-muted-foreground">
                    {product.brands.name}
                  </span>
                </div>
              )}
              
              {/* Category Badge */}
              {product.categories && (
                <Badge variant="secondary" className="mb-3 sm:mb-4 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                  {product.categories.name}
                </Badge>
              )}
              
              <h1 className="text-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 leading-tight">{product.name}</h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 mb-4 sm:mb-6">
                <div className="flex items-center space-x-1">
                    {reviewCount > 0 ? (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-5 h-5 ${i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-gray-600 ml-2 font-medium text-sm sm:text-base">
                          ({averageRating.toFixed(1)}) • {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                        </span>
                      </>
                    ) : (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-gray-300" />
                        ))}
                        <span className="text-gray-600 ml-2 font-medium text-sm sm:text-base">
                          No reviews yet
                        </span>
                      </>
                    )}
                  <span className="text-gray-600 ml-2 font-medium text-sm sm:text-base">
                    
                  </span>
                </div>
              </div>
              
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6">
                ${parseFloat(product.price).toFixed(2)}
              </div>
              
              {product.description && (
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg mb-4 sm:mb-6">{product.description}</p>
              )}
              
              {/* Product Details */}
              {(product.material || product.sku || product.tags) && (
                <div className="space-y-2 mb-4 sm:mb-6">
                  {product.material && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Material:</span> {product.material}
                    </p>
                  )}
                  {product.sku && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">SKU:</span> {product.sku}
                    </p>
                  )}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {product.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Stock Status */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50 rounded-none">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    {product.stock > 0 ? (
                      <>
                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-700 font-bold text-base sm:text-lg">In Stock</span>
                        <span className="text-gray-600 text-sm sm:text-base">({product.stock} available)</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-red-700 font-bold text-base sm:text-lg">Out of Stock</span>
                      </>
                    )}
                  </div>
                  {product.stock <= 5 && product.stock > 0 && (
                    <Badge variant="destructive" className="animate-pulse">
                      Only {product.stock} left!
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Quantity and Add to Cart */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                <label className="text-base sm:text-lg font-semibold text-gray-700">Quantity:</label>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-4 sm:px-6 py-2 sm:py-3 border-x-2 border-gray-200 font-bold text-base sm:text-lg min-w-[50px] sm:min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="btn-gradient flex-1 h-12 sm:h-14 text-base sm:text-lg shadow-xl"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Add to Cart
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => handleWishlistToggle()}
                  disabled={wishlistLoading}
                  className={`h-12 sm:h-14 px-4 sm:px-6 border-2 transition-colors ${
                    isInWishlist 
                      ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                      : 'hover:bg-red-50 hover:border-red-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isInWishlist ? 'fill-current' : ''}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleShare}
                  className="h-12 sm:h-14 px-4 sm:px-6 border-2 hover:bg-blue-50 hover:border-blue-200"
                >
                  <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>
            </div>

            {/* Enhanced Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t-2 border-gray-100">
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">Free Shipping</p>
                  <p className="text-xs sm:text-sm text-gray-600">On orders over $50</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-green-50 hover:bg-green-100 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">Secure Payment</p>
                  <p className="text-xs sm:text-sm text-gray-600">SSL encrypted</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-orange-50 hover:bg-orange-100 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">Easy Returns</p>
                  <p className="text-xs sm:text-sm text-gray-600">30-day policy</p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-6 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-gray-600">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-xs sm:text-sm font-medium">Verified Product</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Award className="w-5 h-5 text-blue-500" />
                <span className="text-xs sm:text-sm font-medium">Premium Quality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Product Tabs */}
        <Card className="border-0 shadow-xl rounded-none">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 sm:h-14 bg-gray-100 p-1 rounded-none">
                <TabsTrigger value="description" className="text-sm sm:text-lg font-medium rounded-none">Description</TabsTrigger>
                <TabsTrigger value="reviews" className="text-sm sm:text-lg font-medium rounded-none">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6 sm:mt-8">
                <div className="prose max-w-none">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Product Description</h3>
                  <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                    {product.description || 'This premium product offers exceptional quality and performance. Crafted with attention to detail and built to last, it represents the perfect blend of functionality and style. Whether for personal use or as a gift, this item exceeds expectations and delivers outstanding value.'}
                  </p>
                  
                  <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-blue-50 p-4 sm:p-6">
                      <h4 className="font-bold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                        <Award className="w-5 h-5 mr-2 text-blue-600" />
                        Premium Features
                      </h4>
                      <ul className="space-y-1 sm:space-y-2 text-gray-600 text-sm sm:text-base">
                        <li>• High-quality materials</li>
                        <li>• Durable construction</li>
                        <li>• Modern design</li>
                        <li>• Easy to use</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 p-4 sm:p-6">
                      <h4 className="font-bold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                        <Clock className="w-5 h-5 mr-2 text-green-600" />
                        What's Included
                      </h4>
                      <ul className="space-y-1 sm:space-y-2 text-gray-600 text-sm sm:text-base">
                        <li>• Main product</li>
                        <li>• User manual</li>
                        <li>• Warranty card</li>
                        <li>• Premium packaging</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6 sm:mt-8">
                <div className="space-y-8">
                  {/* Reviews Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h3>
                      <div className="flex items-center">
                        <div className="flex items-center mr-3">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-5 h-5 ${i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <p className="text-gray-600">
                          {reviewCount > 0 
                            ? `Based on ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
                            : 'No reviews yet'}
                        </p>
                      </div>
                    </div>
                    
                    {user && !userHasReviewed && (
                      <Button 
                        onClick={() => setReviewFormVisible(!reviewFormVisible)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Write a Review
                      </Button>
                    )}
                    
                    {!user && (
                      <Button asChild variant="outline">
                        <Link to="/login">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Sign in to Review
                        </Link>
                      </Button>
                    )}
                  </div>
                  
                  {/* Review Form */}
                  {reviewFormVisible && user && (
                    <Card className="border-2 border-blue-100 bg-blue-50">
                      <CardContent className="pt-6">
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                          <div>
                            <Label htmlFor="rating" className="text-base font-medium mb-2 block">
                              Your Rating *
                            </Label>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className="focus:outline-none"
                                >
                                  <Star 
                                    className={`w-8 h-8 ${
                                      star <= reviewRating 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    } hover:fill-yellow-400 hover:text-yellow-400 transition-colors`} 
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="title" className="text-base font-medium mb-2 block">
                              Review Title *
                            </Label>
                            <Input
                              id="title"
                              value={reviewTitle}
                              onChange={(e) => setReviewTitle(e.target.value)}
                              placeholder="Summarize your experience"
                              required
                              className="bg-white"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="comment" className="text-base font-medium mb-2 block">
                              Review *
                            </Label>
                            <Textarea
                              id="comment"
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Share your experience with this product..."
                              rows={4}
                              required
                              className="bg-white"
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => setReviewFormVisible(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={submittingReview}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                            >
                              {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Reviews List */}
                  <div className="space-y-6">
                    {productReviews.length === 0 ? (
                      <div className="text-center py-12 border border-dashed rounded-lg">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h4>
                        <p className="text-gray-600 mb-6">Be the first to review this product</p>
                        {user && !userHasReviewed && (
                          <Button 
                            onClick={() => setReviewFormVisible(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          >
                            Write a Review
                          </Button>
                        )}
                        {!user && (
                          <Button asChild variant="outline">
                            <Link to="/login">
                              Sign in to Review
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      productReviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-6 bg-white">
                          <div className="flex justify-between mb-3">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-3">
                                {review.users?.email.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="font-medium">{review.users?.email || 'Anonymous'}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          
                          <h4 className="text-lg font-semibold mb-2">{review.title}</h4>
                          <p className="text-gray-700 mb-4">{review.comment}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {review.is_verified_purchase && (
                                <Badge className="bg-green-100 text-green-800">
                                  <Check className="w-3 h-3 mr-1" />
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                Helpful
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                                <Flag className="w-4 h-4 mr-1" />
                                Report
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}