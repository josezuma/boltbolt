import { useState, useEffect } from 'react';
import { AlertTriangle, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface StripeWebhookHelperProps {
  isTestMode: boolean;
}

export function StripeWebhookHelper({ isTestMode }: StripeWebhookHelperProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    // Get the base URL for the webhook
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || window.location.origin;
    setWebhookUrl(`${baseUrl}/functions/v1/stripe-webhook`);
  }, []);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('Webhook URL copied to clipboard');
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };
  
  return (
    <div className="space-y-4">
      <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700">
          You need to set up a webhook in your Stripe dashboard to receive payment events.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Your Webhook URL:</p>
        <div className="flex items-center space-x-2">
          <code className="bg-muted px-3 py-2 rounded text-sm font-mono flex-1 overflow-x-auto">
            {webhookUrl}
          </code>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyToClipboard}
            className="flex-shrink-0"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Required Webhook Events:</p>
        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
          <li>payment_intent.succeeded</li>
          <li>payment_intent.payment_failed</li>
          <li>charge.refunded</li>
        </ul>
      </div>
      
      <div className="pt-2">
        <p className="text-sm text-muted-foreground">
          {isTestMode ? (
            <span className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-1" />
              You're in test mode. Use the Stripe test dashboard to set up webhooks.
            </span>
          ) : (
            <span>Configure this in your Stripe dashboard under Developers → Webhooks.</span>
          )}
        </p>
      </div>
    </div>
  );
}