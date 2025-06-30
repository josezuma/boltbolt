import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Stripe from "npm:stripe@14.18.0";

// Debug helper function
function logDebug(message: string, data?: any) {
  console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
}

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    logDebug("Create payment function called");
    
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get request data
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
    
    const { amount, currency, paymentMethodType, orderId, userId } = requestData;
    logDebug("Create payment function received request:", { 
      amount, 
      currency, 
      paymentMethodType,
      orderId: orderId,
      userId: userId
    });

    // Validate required fields
    if (!amount || !currency || !orderId || !userId) {
      console.error("❌ Missing required fields:", { amount, currency, paymentMethodType, orderId, userId });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get Stripe configuration from database
    const { data: stripeSecretKeyData, error: secretKeyError } = await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "stripe_secret_key")
      .single();

    if (secretKeyError) {
      console.error(`❌ Error fetching Stripe secret key: ${secretKeyError.code} - ${secretKeyError.message}`);
      throw new Error(`Error fetching Stripe secret key: ${secretKeyError.message}`);
    }

    const { data: testModeData, error: testModeError } = await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "stripe_test_mode")
      .single();

    if (testModeError) {
      console.error(`❌ Error fetching Stripe test mode: ${testModeError.code} - ${testModeError.message}`);
      throw new Error(`Error fetching Stripe test mode: ${testModeError.message}`);
    }

    // Get Stripe processor from database
    const { data: stripeProcessor, error: processorError } = await supabaseClient
      .from("payment_processors")
      .select("id")
      .eq("name", "stripe")
      .single();

    if (processorError) {
      console.error(`❌ Error fetching Stripe processor: ${processorError.code} - ${processorError.message}`);
      throw new Error(`Error fetching Stripe processor: ${processorError.message}`);
    }

    // Initialize Stripe with the secret key from database
    const stripeSecretKey = stripeSecretKeyData.value?.toString();
    if (!stripeSecretKey) {
      console.error("❌ Stripe secret key not found in database");
      throw new Error("Stripe secret key not found in database");
    }
    
    logDebug(`Using Stripe secret key: ${stripeSecretKey.substring(0, 7)}...`);

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Create a payment intent
    console.log(`💰 Creating payment intent for amount: ${amount} ${currency}`);
    let paymentIntentParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase().trim(),
      // We'll use either payment_method_types OR automatic_payment_methods, not both
      metadata: {
        order_id: orderId.trim(),
        user_id: userId.trim(),
      },
    };
    
    // Add either payment_method_types or automatic_payment_methods, not both
    if (paymentMethodType) {
      paymentIntentParams.payment_method_types = [paymentMethodType];
    } else {
      paymentIntentParams.automatic_payment_methods = { enabled: true };
    }
    
    logDebug("Creating payment intent with params", paymentIntentParams);
    
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    } catch (error) {
      console.error(`❌ Error creating Stripe payment intent: ${error.message}`);
      throw new Error(`Error creating Stripe payment intent: ${error.message}`);
    }
    
    logDebug(`Payment intent created: ${paymentIntent.id}`);

    // Record the payment transaction in the database
    const { data: transaction, error: transactionError } = await supabaseClient
      .from("payment_transactions")
      .insert([{
        order_id: orderId,
        payment_processor_id: stripeProcessor.id,
        processor_payment_intent_id: paymentIntent.id,
        amount: amount,
        currency: currency,
        status: "processing",
        payment_method: {
          type: paymentMethodType,
        },
        metadata: {
          is_test_mode: testModeData.value === true,
        },
      }])
      .select()
      .single();

    if (transactionError) {
      console.error(`❌ Error recording payment transaction: ${transactionError.code} - ${transactionError.message}`);
      throw new Error(`Error recording payment transaction: ${transactionError.message}`);
    }
    
    logDebug(`Transaction recorded: ${transaction.id}`);
    console.log(`🔑 Client secret: ${paymentIntent.client_secret ? paymentIntent.client_secret.substring(0, 10) + '...' : 'MISSING'}`);

    // Return the client secret to the client
    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        transactionId: transaction.id,
        isTestMode: testModeData.value === true
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }, 
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    console.error(error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }, 
        status: 500 
      }
    );
  }
});