import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Function to get Stripe publishable key from database
export const getStripePublishableKey = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'stripe_publishable_key')
      .single();
    
    if (error) throw error;
    
    // Return the value or a fallback test key
    return data?.value?.toString() || '';
  } catch (error) {
    console.error('Error fetching Stripe publishable key:', error);
    return ''; // Return empty string on error
  }
};

// Function to check if Stripe is in test mode
export const isStripeTestMode = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'stripe_test_mode')
      .single();
    
    if (error) throw error;
    
    return data?.value === true;
  } catch (error) {
    console.error('Error checking Stripe test mode:', error);
    return true; // Default to test mode on error for safety
  }
};

// Initialize Stripe lazily to ensure we have the key
export const getStripe = async () => {
  const key = await getStripePublishableKey();
  if (!key) {
    throw new Error('Stripe publishable key not found');
  }
  return loadStripe(key);
};

// Create payment intent via Supabase Edge Function
export const createPaymentIntent = async (
  amount: number, 
  currency: string = 'USD', 
  orderId: string, 
  userId: string
) => {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`;
    console.log('🔄 Creating payment intent at URL:', apiUrl);

    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error('Authentication error: ' + authError.message);
    }
    
    const token = authData.session?.access_token;
    
    if (!token) {
      console.error('❌ No auth token available');
      throw new Error('User not authenticated');
    }
    
    console.log('Creating payment intent:', { 
      amount, 
      currency, 
      orderId: orderId || 'missing', 
      userId: userId || 'missing' 
    });
    console.log('🔑 Auth token available:', token ? 'Yes' : 'No');
    
    // Prepare the request payload
    const payload = {
      amount: parseFloat(amount.toFixed(2)),
      currency: currency.toUpperCase(),
      orderId: orderId,
      userId: userId,
      paymentMethodType: 'card'  // Explicitly specify card as payment method type
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error('❌ Payment intent creation failed:', response.status, response.statusText);
      const errorText = await response.text();
      try {
        console.error('Error response:', errorText);
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Failed to create payment intent');
      } catch (e) {
        throw new Error(`Failed to create payment intent: ${errorText}`);
      }
    }
    
    const result = await response.json();

    if (!result.clientSecret) {
      console.error('❌ No client secret in response:', result);
      throw new Error('Invalid response from payment service: missing client secret');
    }

    console.log('✅ Payment intent creation result:', {
      clientSecret: result.clientSecret ? 'Present (hidden)' : 'MISSING',
      paymentIntentId: result.paymentIntentId ? result.paymentIntentId.substring(0, 8) + '...' : 'missing',
      transactionId: result.transactionId ? result.transactionId.substring(0, 8) + '...' : 'missing'
    });
    
    return result;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Process payment via Supabase Edge Function
export const processPayment = async (
  paymentIntentId: string,
  transactionId: string | null,
  orderId: string
) => {
  try {
    console.log('🔄 Starting payment processing...');
    console.log('Payment details:', {
      paymentIntentId: paymentIntentId ? paymentIntentId.substring(0, 8) + '...' : 'null',
      transactionId: transactionId ? transactionId.substring(0, 8) + '...' : 'null',
      orderId: orderId.substring(0, 8) + '...'
    });
    
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`;

    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error('Authentication error: ' + authError.message);
    }
    
    const token = authData.session?.access_token;

    if (!token) {
      console.error('❌ No auth token available');
      // Continue without authentication for testing purposes
      console.warn('⚠️ Proceeding without authentication token (for testing)');
    }
    
    console.log('🔄 Preparing to call process-payment edge function...');

    const response = await fetch(apiUrl, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 
        'Authorization': token ? `Bearer ${token}` : '',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        paymentIntentId,
        transactionId,
        orderId
      }),
    });
    
    console.log('🔄 Process payment response status:', response.status);
    
    // Log response headers for debugging
    if (response.status !== 200) {
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log('🔄 Response headers:', headers);
    }

    if (!response.ok) {
      console.error(`Process payment response not OK: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      try {
        console.error('❌ Error response body:', errorText);
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Failed to process payment');
      } catch (e) {
        throw new Error(`Failed to process payment: ${errorText}`);
      }
    }

    const result = await response.json();
    console.log(`✅ Payment verification result:`, {
      success: result.success,
      status: result.status || 'unknown',
      message: result.message || 'No message'
    });
    
    // If the server says the payment was successful, return success
    if (result.success) {
      return result;
    }
    
    // If we get here, something went wrong
    throw new Error(`Payment verification failed: ${result.message || 'Unknown error'}`);
    
  } catch (error: any) {
    console.error('Error processing payment:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};