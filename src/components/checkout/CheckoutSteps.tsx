import { ChevronRight } from 'lucide-react';

interface CheckoutStepsProps {
  activeStep: string;
  paymentStatus: 'idle' | 'processing' | 'succeeded' | 'failed';
}

export function CheckoutSteps({ activeStep, paymentStatus }: CheckoutStepsProps) {
  return (
    <div className="flex items-center justify-center space-x-2 text-sm">
      <span className={activeStep === 'shipping' ? 'font-bold' : 'text-muted-foreground'}>
        Shipping
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
      <span className={activeStep === 'payment' ? 'font-bold' : 'text-muted-foreground'}>
        Payment
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
      <span className={paymentStatus === 'succeeded' ? 'font-bold' : 'text-muted-foreground'}>
        Confirmation
      </span>
    </div>
  );
}