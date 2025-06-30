import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Stripe from "npm:stripe@14.18.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true"
};

// Debug helper function
function logDebug(message: string, data?: any, isError = false) {
  const prefix = isError ? '❌ ERROR:' : '🔍 DEBUG:';
  console.log(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { ...corsHeaders },
      status: 204,
    });
  }

  try {
    logDebug("Process payment function called");
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    logDebug("Supabase client created");

    // Get request data
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      logDebug("Error parsing request body:", error, true);
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const { paymentIntentId, transactionId, orderId } = requestData;
    
    logDebug("Process payment request received", { 
      paymentIntentId, 
      transactionId: transactionId ? transactionId.substring(0, 8) + '...' : 'null',
      orderId: orderId.substring(0, 8) + '...'
    });

    // Validate required fields
    if (!paymentIntentId || !orderId) {
      logDebug(`Missing required fields: ${!paymentIntentId ? 'paymentIntentId' : ''} ${!orderId ? 'orderId' : ''}`, null, true);
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          }, 
          status: 400 
        }
      );
    }

    logDebug("Fetching Stripe configuration from database");
    
    const { data: stripeSecretKeyData, error: secretKeyError } = await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "stripe_secret_key")
      .single();

    if (secretKeyError) {
      logDebug(`Error fetching Stripe secret key: ${secretKeyError.code} - ${secretKeyError.message}`, null, true);
      throw new Error(`Error fetching Stripe secret key: ${secretKeyError.message}`);
    }

    // Initialize Stripe with the secret key from database
    logDebug("Initializing Stripe client");
    const stripeSecretKey = stripeSecretKeyData.value?.toString();
    if (!stripeSecretKey) {
      logDebug("Stripe secret key not found in database", null, true);
      throw new Error("Stripe secret key not found in database");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
    logDebug(`Retrieving payment intent ${paymentIntentId.substring(0, 8)}... from Stripe`);

    // Retrieve the payment intent from Stripe to check its status
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logDebug(`Error retrieving payment intent: ${error.message}`, null, true);
      return new Response(
        JSON.stringify({ error: `Failed to retrieve payment intent: ${error.message}` }),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          }, 
          status: 500 
        }
      );
    }

    logDebug(`Payment intent retrieved with status: ${paymentIntent.status}`);

    // Update the payment transaction in the database
    if (transactionId) {
      logDebug(`Updating payment transaction ${transactionId.substring(0, 8)}...`);
      const { error: transactionError } = await supabaseClient
        .from("payment_transactions")
        .update({
          status: paymentIntent.status === "succeeded" ? "succeeded" : 
                 paymentIntent.status === "canceled" ? "cancelled" : 
                 paymentIntent.status === "processing" ? "processing" : "failed",
          processor_response: JSON.parse(JSON.stringify(paymentIntent)), // Ensure it's serializable
          processed_at: paymentIntent.status === "succeeded" ? new Date().toISOString() : null,
          failed_at: paymentIntent.status === "canceled" || paymentIntent.status === "requires_payment_method" ? 
                    new Date().toISOString() : null,
          failure_reason: paymentIntent.last_payment_error?.message || null,
        })
        .eq("id", transactionId);

      if (transactionError) {
        logDebug(`Error updating payment transaction: ${transactionError.message}`, null, true);
        // Continue anyway - don't throw error as we still want to check payment status
      }
    }

    // If payment succeeded, update the order status
    // For testing, we'll consider both succeeded and requires_capture as successful
    if (paymentIntent.status === "succeeded" || paymentIntent.status === "requires_capture") {
    }
    if (paymentIntent.status === "succeeded" || paymentIntent.status === "requires_capture") {
      logDebug(`Payment succeeded, updating order ${orderId.substring(0, 8)}... status to confirmed`);
      const { error: orderError } = await supabaseClient
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId)
        .select();

      if (orderError) {
        logDebug(`Error updating order status: ${orderError.message}`, null, true);
        throw new Error(`Failed to update order status: ${orderError.message}`);
      } else {
        logDebug(`Order ${orderId.substring(0, 8)}... status updated to confirmed`);
      }
    } else if (paymentIntent.status === "canceled" || paymentIntent.status === "requires_payment_method") {
      // If payment failed or was canceled, update order status to cancelled
      logDebug(`Payment failed or canceled, updating order ${orderId.substring(0, 8)}... status to cancelled`);
      const { error: orderError } = await supabaseClient
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (orderError) {
        logDebug(`Error updating order status to cancelled: ${orderError.message}`, null, true);
        throw new Error(`Failed to update order status to cancelled: ${orderError.message}`);
      } else {
        logDebug(`Order ${orderId.substring(0, 8)}... status updated to cancelled`);
      }
    }

    // Return the payment status
    logDebug(`Returning payment status: ${paymentIntent.status}`);
    return new Response(
      JSON.stringify({ 
        status: paymentIntent.status, 
        success: paymentIntent.status === "succeeded" || paymentIntent.status === "processing" || paymentIntent.status === "requires_capture",
        message: `Payment ${paymentIntent.status === "succeeded" ? "successful" : paymentIntent.status}`,
        orderId: orderId
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
    logDebug("Error processing payment:", error, true);
    if (error.stack) {
      logDebug("Error stack:", error.stack, true);
    }
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