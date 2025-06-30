import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Shield, Truck, RotateCcw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState } from 'react';

export function Cart() {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState<{
    id: string;
    name: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
  } | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const tax = totalPrice * 0.08;
  
  // Calculate discount amount
  const discountAmount = discount 
    ? discount.discount_type === 'percentage' 
      ? (totalPrice * discount.discount_value / 100) 
      : Math.min(discount.discount_value, totalPrice)
    : 0;
    
  const finalTotal = totalPrice - discountAmount + tax;

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    
    setApplyingDiscount(true);
    
    try {
      // Check if the promo code exists and is valid
      const { data, error } = await supabase
        .from('discounts')
        .select('id, name, discount_type, discount_value, minimum_purchase_amount, usage_limit, usage_limit_per_customer, starts_at, ends_at')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (error) {
        toast.error('Invalid promo code');
        return;
      }
      
      // Check if the discount is valid (dates)
      const now = new Date();
      const startsAt = data.starts_at ? new Date(data.starts_at) : null;
      const endsAt = data.ends_at ? new Date(data.ends_at) : null;
      
      if ((startsAt && now < startsAt) || (endsAt && now > endsAt)) {
        toast.error('This promo code is not valid at this time');
        return;
      }
      
      // Check minimum purchase amount
      if (data.minimum_purchase_amount && totalPrice < parseFloat(data.minimum_purchase_amount)) {
        toast.error(`This code requires a minimum purchase of $${parseFloat(data.minimum_purchase_amount).toFixed(2)}`);
        return;
      }
      
      // Set the discount
      setDiscount({
        id: data.id,
        name: data.name,
        discount_type: data.discount_type,
        discount_value: parseFloat(data.discount_value)
      });
      
      toast.success('Promo code applied successfully!');
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast.error('Failed to apply promo code');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscount(null);
    setPromoCode('');
    toast.success('Promo code removed');
  };

  if (items.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="custom-container py-12 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8 sm:mb-12">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">Your Cart is Empty</h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-12 leading-relaxed px-4">
                Looks like you haven't added any items to your cart yet. 
                Start shopping to fill it up with amazing products!
              </p>
              <Button asChild size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-xl">
                <Link to="/products">
                  <ShoppingBag className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
                  Start Shopping
                </Link>
              </Button>
              <Button asChild size="lg" className="btn-gradient px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-xl">
                <Link to="/products">
                  <ShoppingBag className="mr-2 w-5 h-5 sm:w-6 sm:h-6" />
                  Start Shopping
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="custom-container py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="mb-8 sm:mb-12">
          <Button variant="ghost" asChild className="mb-4 sm:mb-6 hover:bg-blue-50 hover:text-blue-600">
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
          
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">Shopping Cart</h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} ready for checkout
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Enhanced Cart Items */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center">
                  <ShoppingBag className="w-6 h-6 mr-3 text-blue-600" />
                  Cart Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6 p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      {/* Enhanced Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-lg mx-auto sm:mx-0">
                          <img
                            src={item.image_url || `https://images.pexels.com/photos/${4792728 + index}/pexels-photo-${4792728 + index}.jpeg?auto=compress&cs=tinysrgb&w=200`}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Enhanced Product Details */}
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                          {item.name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mb-2">
                          <p className="text-base sm:text-lg font-semibold text-blue-600">
                            ${item.price.toFixed(2)} each
                          </p>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">(4.8)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start space-x-2">
                          {item.stock > 0 ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              In Stock ({item.stock})
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Quantity Controls */}
                      <div className="flex items-center justify-center space-x-3">
                        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 sm:px-4 py-2 border-x-2 border-gray-200 font-bold text-base sm:text-lg min-w-[45px] sm:min-w-[50px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Enhanced Price and Remove */}
                      <div className="text-center sm:text-right">
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 mx-auto sm:mx-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {index < items.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4 sm:space-y-6">
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl font-bold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between text-base sm:text-lg">
                      <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                      <span className="font-semibold text-gray-900">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base sm:text-lg">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                    
                    {discount && (
                      <div className="flex justify-between text-base sm:text-lg">
                        <span className="text-gray-600 flex items-center">
                          Discount
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {promoCode}
                          </span>
                        </span>
                        <span className="font-semibold text-green-600">-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-base sm:text-lg">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl sm:text-2xl font-bold">
                      <span>Total</span>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button asChild className="btn-gradient w-full h-12 sm:h-14 text-base sm:text-lg shadow-xl">
                      <Link to="/checkout">
                        Proceed to Checkout
                      </Link>
                    </Button>
                    <Button asChild className="btn-secondary w-full h-10 sm:h-12 text-sm sm:text-base">
                      <Link to="/products">
                        Continue Shopping
                      </Link>
                    </Button>
                  </div>

                  {/* Enhanced Security Badges */}
                  <div className="pt-6 border-t">
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-green-50 rounded-xl">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="text-xs sm:text-sm font-medium text-green-700">Secure Checkout</span>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-blue-50 rounded-xl">
                        <Truck className="w-5 h-5 text-blue-600" />
                        <span className="text-xs sm:text-sm font-medium text-blue-700">Free Shipping</span>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-orange-50 rounded-xl">
                        <RotateCcw className="w-5 h-5 text-orange-600" />
                        <span className="text-xs sm:text-sm font-medium text-orange-700">Easy Returns</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Promo Code Card */}
              <Card className={`border-0 shadow-lg ${discount ? 'bg-green-50' : 'bg-gradient-to-br from-purple-50 to-blue-50'}`}>
                <CardContent className="p-4 sm:p-6">
                  {discount ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-green-800 text-sm sm:text-base">Promo code applied!</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleRemoveDiscount}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                      <p className="text-sm text-green-700">{discount.name}</p>
                      <p className="text-xs text-green-600">
                        {discount.discount_type === 'percentage' 
                          ? `${discount.discount_value}% off your order` 
                          : `$${discount.discount_value.toFixed(2)} off your order`}
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Have a promo code?</h3>
                      <div className="flex space-x-2">
                        <Input
                          type="text"
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          className="border-2 text-sm sm:text-base px-3 sm:px-4"
                          onClick={handleApplyPromoCode}
                          disabled={applyingDiscount}
                        >
                          {applyingDiscount ? 'Applying...' : 'Apply'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}