import { useState, useEffect } from 'react';
import { 
  PaymentElement, 
  useStripe, 
  useElements,
  AddressElement
} from '@stripe/react-stripe-js';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { processPayment } from '@/lib/stripe';

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

interface StripePaymentFormProps {
  billingInfo: BillingInfo;
  handleBillingChange: (field: keyof BillingInfo, value: string | boolean) => void;
  isProcessingPayment: boolean;
  paymentStatus: 'idle' | 'processing' | 'succeeded' | 'failed';
  total: number;
  orderId: string | null;
  paymentIntentId: string;
  transactionId: string;
  onPaymentSuccess: () => void;
}

export function StripePaymentForm({
  billingInfo,
  handleBillingChange,
  isProcessingPayment,
  paymentStatus,
  total,
  orderId,
  paymentIntentId,
  transactionId,
  onPaymentSuccess
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Check if we have a payment intent and if it's already succeeded
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Please provide your payment details.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements || !orderId) {
      // Stripe.js hasn't yet loaded or orderId is missing
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Confirm the payment with Stripe Elements
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation/${orderId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // This point will only be reached if there is an immediate error when
        // confirming the payment. Show error to your customer (for example, payment
        // details incomplete)
        setMessage(error.message || "An unexpected error occurred.");
        toast.error(error.message || "Payment failed. Please try again.");
        setIsLoading(false);
        return;
      } 
      
      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
        // The payment has been processed!
        console.log('Payment succeeded or processing:', paymentIntent.status);
        
        // Verify the payment with our server
        try {
          const verificationResult = await processPayment(
            paymentIntentId,
            transactionId,
            orderId
          );
          
          console.log('Payment verification result:', verificationResult);
          
          if (verificationResult.success) {
            setMessage("Payment successful!");
            toast.success("Payment successful!");
            onPaymentSuccess();
          } else {
            setMessage("Payment verification failed. Please contact support.");
            toast.error("Payment verification failed. Please contact support.");
          }
        } catch (verifyError) {
          console.error('Error verifying payment:', verifyError);
          setMessage("Payment completed but verification failed. Please contact support.");
          toast.error("Payment completed but verification failed. Please contact support.");
        }
      } else {
        setMessage("Payment processing. Please wait...");
      }
    } catch (submitError) {
      console.error('Error submitting payment:', submitError);
      setMessage("An error occurred while processing your payment.");
      toast.error("An error occurred while processing your payment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Billing Address */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Billing Information</h3>
        
        <div className="bg-muted p-4 rounded-lg">
          <PaymentElement />
        </div>
      </div>
      
      {/* Payment Status */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('succeeded') || message.includes('successful') ? 'bg-green-50 text-green-700' :
          message.includes('processing') ? 'bg-blue-50 text-blue-700' :
          'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center">
            {message.includes('succeeded') || message.includes('successful') ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : message.includes('processing') ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            <p>{message}</p>
          </div>
        </div>
      )}
      
      <div className="pt-4">
        <Button 
          type="submit"
          disabled={isLoading || !stripe || !elements || paymentStatus === 'succeeded'}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              Pay ${total.toFixed(2)}
              <Lock className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
      
      <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground pt-4">
        <div className="flex items-center">
          <Lock className="w-3 h-3 mr-1" />
          <span>Secure Checkout</span>
        </div>
        <div className="flex items-center">
          <svg className="w-3 h-3 mr-1" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 13.4v8.6c0 .9-.7 1.6-1.6 1.6H28v-12h2.4c.9 0 1.6.7 1.6 1.6v.2zm-4 9.4v-12h-4v12h4zm-5.5 0v-12h-3.2l-2.2 9.8-2.2-9.8h-3.2v12h2.2v-8.6l1.7 8.6h2l1.7-8.6v8.6h2.2zm-13.2-7l.2-1 .2-1h-3.4l-.6 3h3.6zm.8 7l.4-2h-4.2l-.4 2h-2.3l2-12h4.2l2 12h-1.7z" fill="currentColor"/>
          </svg>
          <span>Powered by Stripe</span>
        </div>
      </div>
    </form>
  );
}