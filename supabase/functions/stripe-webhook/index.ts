import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Stripe from "npm:stripe@14.18.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Debug helper function
function logDebug(message: string, data?: any) {
  console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    logDebug("Webhook received");
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    logDebug("Supabase client created");

    // Get Stripe configuration from database
    const { data: stripeSecretKeyData, error: secretKeyError } = await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "stripe_secret_key")
      .single();

    if (secretKeyError) {
      logDebug(`Error fetching Stripe secret key: ${secretKeyError.message}`);
      throw new Error(`Error fetching Stripe secret key: ${secretKeyError.message}`);
    }

    const { data: webhookSecretData, error: webhookSecretError } = await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "stripe_webhook_secret")
      .single();

    if (webhookSecretError) {
      logDebug(`Warning: Webhook secret not found: ${webhookSecretError.message}`);
      console.warn(`Warning: Webhook secret not found: ${webhookSecretError.message}`);
      // Continue without webhook verification if secret not found
    }

    // Get Stripe processor from database
    const { data: stripeProcessor, error: processorError } = await supabaseClient
      .from("payment_processors")
      .select("id")
      .eq("name", "stripe")
      .single();

    if (processorError) {
      logDebug(`Error fetching Stripe processor: ${processorError.message}`);
      throw new Error(`Error fetching Stripe processor: ${processorError.message}`);
    }

    // Initialize Stripe with the secret key from database
    const stripeSecretKey = stripeSecretKeyData.value?.toString();
    if (!stripeSecretKey) {
      logDebug("Stripe secret key not found in database");
      throw new Error("Stripe secret key not found in database");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
    logDebug("Stripe initialized");

    // Get the request body as text for signature verification
    const body = await req.text();
    logDebug("Request body received", { bodyLength: body.length });

    // Parse the event data without verification first
    let event = JSON.parse(body);
    logDebug("Event parsed successfully", { type: event.type, id: event.id });

    // Parse the event data
    // For development, we'll skip signature verification
    // In production, you would verify the signature using:
    // const signature = req.headers.get("stripe-signature");
    // if (signature && webhookSecret) {
    //   event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    // }
    
    logDebug("Processing webhook without signature verification (development mode)");

    // Store the webhook event in the database
    logDebug("Storing webhook event in database");
    const { data: webhookEvent, error: webhookError } = await supabaseClient
      .from("webhook_events")
      .insert({
        payment_processor_id: stripeProcessor.id,
        event_id: event.id,
        event_type: event.type,
        event_data: event,
      })
      .select()
      .single();

    if (webhookError) {
      // Log the error but continue processing
      logDebug(`Error storing webhook event: ${webhookError.message}`);
      console.error(`Error storing webhook event: ${webhookError.message}`);
    } else {
      logDebug("Webhook event stored successfully", { id: webhookEvent.id });
    }

    // Process the event based on its type
    let paymentTransaction;
    let orderId;
    
    logDebug(`Processing event type: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        logDebug("Payment intent succeeded", { id: paymentIntent.id });
        
        // Find the transaction by payment intent ID
        const { data: transaction, error: transactionError } = await supabaseClient
          .from("payment_transactions")
          .select("id, order_id")
          .eq("processor_payment_intent_id", paymentIntent.id)
          .single();

        if (transactionError) {
          logDebug(`Error finding transaction: ${transactionError.message}`);
          console.error(`Error finding transaction: ${transactionError.message}`);
          throw new Error(`Could not find transaction for payment intent ${paymentIntent.id}: ${transactionError.message}`);
        }

        paymentTransaction = transaction;
        orderId = transaction.order_id;
        logDebug("Found transaction", { id: transaction.id, orderId });

        // Update the transaction status
        const { error: updateError } = await supabaseClient
          .from("payment_transactions")
          .update({
            status: "succeeded",
            processor_response: paymentIntent,
            processed_at: new Date().toISOString(),
          })
          .eq("id", transaction.id);
          
        if (updateError) {
          logDebug(`Error updating transaction: ${updateError.message}`);
          console.error(`Error updating transaction: ${updateError.message}`);
          throw new Error(`Failed to update transaction ${transaction.id}: ${updateError.message}`);
        } else {
          logDebug("Transaction updated successfully");
        }

        // Update the order status
        const { error: orderError } = await supabaseClient
          .from("orders")
          .update({ status: "confirmed" })
          .eq("id", orderId);
          
        if (orderError) {
          logDebug(`Error updating order: ${orderError.message}`);
          console.error(`Error updating order: ${orderError.message}`);
          throw new Error(`Failed to update order ${orderId}: ${orderError.message}`);
        } else {
          logDebug("Order updated successfully");
        }

        // Update the webhook event with the transaction ID
        if (webhookEvent) {
          const { error: webhookUpdateError } = await supabaseClient
            .from("webhook_events")
            .update({
              payment_transaction_id: transaction.id,
              processed: true,
              processed_at: new Date().toISOString(),
            })
            .eq("id", webhookEvent.id);
            
          if (webhookUpdateError) {
            logDebug(`Error updating webhook event: ${webhookUpdateError.message}`);
            console.error(`Error updating webhook event: ${webhookUpdateError.message}`);
          } else {
            logDebug("Webhook event updated successfully");
          }
        }
        break;

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object;
        logDebug("Payment intent failed", { id: failedPaymentIntent.id });
        
        // Find the transaction by payment intent ID
        const { data: failedTransaction, error: failedTransactionError } = await supabaseClient
          .from("payment_transactions")
          .select("id, order_id")
          .eq("processor_payment_intent_id", failedPaymentIntent.id)
          .single();

        if (failedTransactionError) {
          logDebug(`Error finding transaction: ${failedTransactionError.message}`);
          console.error(`Error finding transaction: ${failedTransactionError.message}`);
          throw new Error(`Could not find transaction for failed payment intent ${failedPaymentIntent.id}: ${failedTransactionError.message}`);
        }
        
        logDebug("Found failed transaction", { id: failedTransaction.id });

        // Update the transaction status
        const { error: failedUpdateError } = await supabaseClient
          .from("payment_transactions")
          .update({
            status: "failed",
            processor_response: failedPaymentIntent,
            failed_at: new Date().toISOString(),
            failure_reason: failedPaymentIntent.last_payment_error?.message || "Payment failed",
          })
          .eq("id", failedTransaction.id);
          
        if (failedUpdateError) {
          logDebug(`Error updating transaction: ${failedUpdateError.message}`);
          console.error(`Error updating transaction: ${failedUpdateError.message}`);
          throw new Error(`Failed to update failed transaction ${failedTransaction.id}: ${failedUpdateError.message}`);
        } else {
          logDebug("Transaction updated successfully");
        }

        // Update the order status to cancelled for failed payments
        const { error: failedOrderError } = await supabaseClient
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", failedTransaction.order_id);
          
        if (failedOrderError) {
          logDebug(`Error updating order for failed payment: ${failedOrderError.message}`);
          console.error(`Error updating order for failed payment: ${failedOrderError.message}`);
          throw new Error(`Failed to update order ${failedTransaction.order_id} for failed payment: ${failedOrderError.message}`);
        } else {
          logDebug("Order updated to cancelled successfully");
        }

        // Update the webhook event with the transaction ID
        if (webhookEvent) {
          const { error: webhookUpdateError } = await supabaseClient
            .from("webhook_events")
            .update({
              payment_transaction_id: failedTransaction.id,
              processed: true,
              processed_at: new Date().toISOString(),
            })
            .eq("id", webhookEvent.id);
            
          if (webhookUpdateError) {
            logDebug(`Error updating webhook event: ${webhookUpdateError.message}`);
            console.error(`Error updating webhook event: ${webhookUpdateError.message}`);
          } else {
            logDebug("Webhook event updated successfully");
          }
        }
        break;

      // Add more event types as needed (refunds, disputes, etc.)
      default:
        logDebug(`Unhandled event type: ${event.type}`);
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a success response
    logDebug("Returning success response");
    return new Response(
      JSON.stringify({ received: true, success: true }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }, 
        status: 200 
      }
    );
  } catch (error) {
    logDebug(`Error processing webhook: ${error.message}`);
    console.error("Error processing webhook:", error);
    console.error(error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});