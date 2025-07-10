import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Truck, CreditCard, ShoppingBag } from 'lucide-react';
import { Elements, StripeElementsOptions } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCartStore, useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { getStripe, createPaymentIntent, processPayment } from '@/lib/stripe';
import { toast } from 'sonner';
import type { Stripe, StripeElements } from '@stripe/stripe-js';

// Import components
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { StripePaymentForm } from '@/components/checkout/StripePaymentForm';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { EmptyCartMessage } from '@/components/checkout/EmptyCartMessage';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

interface BillingInfo {
  sameAsShipping: boolean;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  
  // State for checkout steps
  const [activeStep, setActiveStep] = useState('shipping');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  
  // Form state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: ''
  });
  
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    sameAsShipping: true,
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  
  // Validation state
  const [shippingValidated, setShippingValidated] = useState(false);
  const [billingValidated, setBillingValidated] = useState(false);
  
  // Calculate totals
  const subtotal = getTotalPrice();
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
  const total = subtotal + tax + shipping;
  
  // Initialize Stripe
  useEffect(() => {
    const initializeStripe = async () => {
      console.log('🔄 Initializing Stripe...'); 
      try { 
        const stripeInstance = await getStripe();
        setStripePromise(Promise.resolve(stripeInstance));
        console.log('✅ Stripe initialized successfully');
      } catch (error: any) {
        console.error('Error initializing Stripe:', error);
        toast.error('Failed to initialize payment system');
      }
    };
    
    initializeStripe();
  }, []);

  
  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  // Ensure customer profile exists when component mounts
  useEffect(() => {
    if (user) {
      ensureCustomerProfile().catch(err => {
        console.error('Error ensuring customer profile exists:', err);
      });
    }
  }, [user]);
  
  const validateShippingForm = () => {
    const requiredFields = [
      shippingAddress.firstName,
      shippingAddress.lastName,
      shippingAddress.address,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.zipCode
    ];
    
    const isValid = requiredFields.every(field => field.trim() !== '');
    setShippingValidated(isValid);
    return isValid;
  };
  
  const validateBillingForm = () => {
    if (billingInfo.sameAsShipping) {
      setBillingValidated(true);
      return true;
    }
    
    const requiredFields = [
      billingInfo.firstName,
      billingInfo.lastName,
      billingInfo.address,
      billingInfo.city,
      billingInfo.state,
      billingInfo.zipCode
    ];
    
    const isValid = requiredFields.every(field => field.trim() !== '');
    setBillingValidated(isValid);
    return isValid;
  };
  
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateShippingForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // If billing is same as shipping, copy the data
    if (billingInfo.sameAsShipping) {
      setBillingInfo({
        ...billingInfo,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country
      });
    }
    
    // Save address if user is logged in
    if (user) {
      saveAddress();
    }
    
    // Move to payment step
    setActiveStep('payment');
    
    // Automatically initialize payment when moving to payment step
    handlePayment();
  };
  
  const handleBillingChange = (field: keyof BillingInfo, value: string | boolean) => {
    setBillingInfo(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If toggling sameAsShipping, copy shipping address to billing
    if (field === 'sameAsShipping' && value === true) {
      setBillingInfo(prev => ({
        ...prev,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country
      }));
    }
  };
  
  const saveAddress = async () => {
    if (!user) return;
    
    try {
      // Check if address already exists
      const { data: existingAddresses, error: checkError } = await supabase
        .from('customer_addresses')
        .select('id')
        .eq('user_id', user.id)
        .eq('address_type', 'shipping');
      
      if (checkError) {
        console.error('Error checking existing addresses:', checkError);
        return;
      }
      
      if (existingAddresses && existingAddresses.length > 0) {
        // Update existing address
        await supabase
          .from('customer_addresses')
          .update({
            first_name: shippingAddress.firstName,
            last_name: shippingAddress.lastName,
            address_line1: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.zipCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            is_default: true
          })
          .eq('id', existingAddresses[0].id);
      } else {
        // Create new address
        await supabase
          .from('customer_addresses')
          .insert([{
            user_id: user.id,
            address_type: 'shipping',
            is_default: true,
            first_name: shippingAddress.firstName,
            last_name: shippingAddress.lastName,
            address_line1: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.zipCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone
          }]);
      }
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };
  
  const createOrder = async () => {
    try {
      if (!user) {
        toast.error('You must be logged in to place an order');
        navigate('/login');
        return null;
      }
      
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total_amount: total.toString(),
          shipping_address: {
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            address: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone
          }
        }])
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        toast.error('Failed to create order');
        return null;
      }
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price.toString()
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        toast.error('Failed to create order items');
        return null;
      }
      
      return order;
    } catch (error) {
      console.error('Error in createOrder:', error);
      toast.error('An error occurred while creating your order');
      return null;
    }
  };
  
  const handlePayment = async () => {
    console.log('🔍 handlePayment function called');

    setIsProcessingPayment(true);
    setPaymentStatus('processing');
    
    try {
      // Create order first
      let order = await createOrder();
      console.log('📦 Order created:', order ? `ID: ${order.id.substring(0, 8)}...` : 'Failed to create order');
      if (!order) {
        setIsProcessingPayment(false);
        setPaymentStatus('failed');
        return;
      }
      
      setOrderId(order.id);
      
      // Create payment intent for Stripe
      console.log('Creating payment intent with details:', {
        amount: total, 
        currency: 'USD', 
        orderId: order.id, 
        userId: user?.id || '' 
      });
      
      let paymentIntentResult;
      
      try {
        paymentIntentResult = await createPaymentIntent(
          total,
          'USD',
          order.id,
          user?.id || 'anonymous'
        );
      } catch (error: any) {
        console.error('❌ Error creating payment intent:', error);
        toast.error('Failed to initialize payment: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setIsProcessingPayment(false);
        setPaymentStatus('failed');
        return;
      }
      
      console.log('✅ Payment intent created successfully:', paymentIntentResult);
      
      if (!paymentIntentResult || !paymentIntentResult.clientSecret) {
        console.error('❌ No client secret returned from payment intent creation');
        toast.error('Failed to initialize payment');
        setIsProcessingPayment(false);
        setPaymentStatus('failed');
        return;
      }
      
      setClientSecret(paymentIntentResult.clientSecret);
      setPaymentIntentId(paymentIntentResult.paymentIntentId); 
      setTransactionId(paymentIntentResult.transactionId);

      // Payment will be handled by Stripe Elements in the StripePaymentForm component
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      toast.error('Payment processing failed');
      setIsProcessingPayment(false);
      setPaymentStatus('failed');
    }
  };
  
  const verifyPaymentWithServer = async (
    paymentIntentId: string,
    transactionId: string | null,
    orderId: string
  ) => {
    console.log('🔍 Verifying payment with server...');
    console.log('Payment details:', {
      paymentIntentId: paymentIntentId.substring(0, 8) + '...',
      transactionId: '[REDACTED]',
      orderId: orderId.substring(0, 8) + '...'
    });
    
    try {
      let result;
      console.log('🔄 About to call processPayment()...');
      try { 
        result = await processPayment(
          paymentIntentId,
          transactionId,
          orderId
        );
        console.log('✅ processPayment() completed with result:', result);
      } catch (error) {
        console.error('❌ Error calling processPayment:', error);
        console.error('❌ Error stack:', error.stack);
        throw new Error(`Error processing payment: ${error.message || 'Unknown error'}`);
      }
      
      console.log('✅ Payment verification result:', result);
      
      if (result.success) {
        return result;
      } else {
        console.error('❌ Payment verification failed with result:', result);
        throw new Error(`Payment verification failed: ${result.message || 'Unknown error'}`);
      } 
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      if (error instanceof Error) {
        console.error('❌ Error stack:', error.stack);
      }
      setPaymentStatus('failed'); 
      toast.error('Failed to verify payment status: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error; // Re-throw to handle in the calling function
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  // Ensure customer profile exists
  const ensureCustomerProfile = async () => {
    if (!user) return;
    console.log('🔍 Ensuring customer profile exists for user:', user.id);
    try {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('No customer profile found, will create one');
        } else {
          console.error('Error checking customer profile:', profileError);
        }
      }
      
      // Create profile if it doesn't exist
      if (!profile) {
        console.log('Creating customer profile for user:', user.id);
        const { error: insertError } = await supabase
          .from('customer_profiles')
          .insert([{ id: user.id }])
          .select();
        
        if (insertError) {
          console.error('❌ Error creating customer profile:', insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Error in ensureCustomerProfile:', error);
    }
  };
  
  // Define Stripe Elements options
  const stripeElementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2A2A2A',
        colorBackground: '#ffffff',
        colorText: '#111111',
        colorDanger: '#AD2B2F',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '0px',
      },
    },
  };
  
  // If cart is empty, show message
  if (items.length === 0) {
    return <EmptyCartMessage />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container-editorial py-12">
        <Button variant="ghost" asChild className="mb-8">
          <a href="/cart">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </a>
        </Button>
        
        <div className="text-center mb-12">
          <h1 className="text-editorial-heading mb-4">Checkout</h1>
          <CheckoutSteps activeStep={activeStep} paymentStatus={paymentStatus} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2">
            <Tabs value={activeStep} onValueChange={setActiveStep}>
              {/* Shipping Information */}
              <TabsContent value="shipping" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      Shipping Information
                    </CardTitle>
                    <CardDescription>
                      Enter your shipping address details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ShippingForm 
                      shippingAddress={shippingAddress}
                      setShippingAddress={setShippingAddress}
                      onSubmit={handleShippingSubmit}
                      userId={user?.id}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Payment Information */}
              <TabsContent value="payment" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Payment Information
                    </CardTitle>
                    <CardDescription>
                      Enter your payment details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {clientSecret && stripePromise ? (
                      <Elements stripe={stripePromise} options={stripeElementsOptions}>
                        <StripePaymentForm 
                          billingInfo={billingInfo}
                          handleBillingChange={handleBillingChange}
                          isProcessingPayment={isProcessingPayment}
                          paymentStatus={paymentStatus}
                          total={total}
                          orderId={orderId}
                          paymentIntentId={paymentIntentId}
                          transactionId={transactionId}
                          onPaymentSuccess={() => {
                            setPaymentStatus('succeeded');
                            clearCart();
                            setTimeout(() => {
                              navigate(`/order-confirmation/${orderId}`);
                            }, 1500);
                          }}
                        />
                      </Elements>
                    ) : isProcessingPayment ? (
                      <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-3 text-primary">Initializing payment...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-12">
                        <div className="animate-pulse text-center">
                          <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Loading payment form...</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveStep('shipping')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Shipping
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Order Summary */}
          <div>
            <OrderSummary 
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              tax={tax}
              total={total}
            />
          </div>
        </div>
      </div>
    </div>
  );
}