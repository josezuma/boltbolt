import { CreditCard, Lock, Shield, AlertCircle, CheckCircle, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BillingForm } from './BillingForm';
import { useState, useEffect } from 'react';

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

interface PaymentFormProps {
  billingInfo: BillingInfo;
  handleBillingChange: (field: keyof BillingInfo, value: string | boolean) => void;
  handlePayment: () => void;
  isProcessingPayment: boolean;
  paymentStatus: 'idle' | 'processing' | 'succeeded' | 'failed';
  total: number;
}

interface CardValidation {
  number: boolean | null;
  expiry: boolean | null;
  cvc: boolean | null;
}

export function PaymentForm({
  billingInfo,
  handleBillingChange,
  handlePayment,
  isProcessingPayment,
  paymentStatus,
  total
}: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [validation, setValidation] = useState<CardValidation>({
    number: null,
    expiry: null,
    cvc: null
  });

  // Validate all fields when component mounts
  useEffect(() => {
    // Set up validation for test card data
    if (cardNumber === '4242 4242 4242 4242') {
      setValidation(prev => ({
        ...prev,
        number: true
      }));
    }
  }, []);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date with slash
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };

  // Validate card number using Luhn algorithm
  const validateCardNumber = (number: string) => {
    // Remove spaces and non-digits
    const cardNumber = number.replace(/\D/g, '');
    
    // Check length (most cards are 13-19 digits)
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return false;
    }
    
    // Luhn algorithm
    let sum = 0;
    let shouldDouble = false;
    
    // Loop from right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return (sum % 10) === 0;
  };

  // Validate expiry date
  const validateExpiryDate = (expiry: string) => {
    // Check format
    if (!expiry || expiry.length < 5) {
      return null;
    }
    
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return false;
    }
    
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    const expiryMonth = parseInt(month, 10);
    const expiryYear = parseInt(year, 10);
    
    // Check if month is valid
    if (expiryMonth < 1 || expiryMonth > 12) {
      return false;
    }
    
    // Handle 2-digit year (add 2000)
    const fullExpiryYear = 2000 + expiryYear;
    
    // Check if date is in the past
    const now = new Date();
    const currentFullYear = now.getFullYear();
    
    if (fullExpiryYear < currentFullYear || 
        (fullExpiryYear === currentFullYear && expiryMonth < currentMonth)) {
      return false;
    }
    
    return true;
  };

  // Validate CVC
  const validateCVC = (cvc: string) => {
    // Most cards have 3-4 digit CVC
    return /^\d{3,4}$/.test(cvc.trim());
  };

  // Handle card number input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
    
    // Only validate if there's input
    if (formattedValue.length > 0) {
      setValidation(prev => ({
        ...prev,
        number: validateCardNumber(formattedValue)
      }));
    } else {
      setValidation(prev => ({
        ...prev,
        number: null
      }));
    }
  };

  // Handle expiry date input
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatExpiryDate(e.target.value);
    const limitedValue = formattedValue.substring(0, 5); // Limit to MM/YY format
    setExpiryDate(limitedValue);
    
    // Only validate if we have a complete MM/YY format
    if (limitedValue.length === 5) {
      setValidation(prev => ({
        ...prev,
        expiry: validateExpiryDate(limitedValue)
      }));
    } else {
      setValidation(prev => ({
        ...prev,
        expiry: null
      }));
    }
  };

  // Handle CVC input
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCvc(value.trim());
    
    // Validate only if there's input
    if (value.length > 0) {
      setValidation(prev => ({
        ...prev,
        cvc: validateCVC(value)
      }));
    } else {
      setValidation(prev => ({
        ...prev,
        cvc: null
      }));
    }
  };

  // Check if all fields are valid
  const isFormValid = () => {
    return (
      (validation.number === true || cardNumber === '4242 4242 4242 4242') && 
      (validation.expiry === true || (expiryDate.length === 5 && validateExpiryDate(expiryDate))) && 
      (validation.cvc === true || (cvc.length >= 3 && cvc.length <= 4)));
  };

  return (
    <div className="space-y-6">
      {/* Billing Address */}
      <BillingForm 
        billingInfo={billingInfo}
        handleBillingChange={handleBillingChange}
        isProcessingPayment={isProcessingPayment}
      />
      
      {/* Credit Card Information */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium text-lg">Card Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Card Number *</Label>
          <div className="relative">
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
                className="pl-10"
                disabled={isProcessingPayment}
              />
              {validation.number !== null && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validation.number ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>
          {validation.number === false && (
            <p className="text-xs text-red-500">
              Please enter a valid card number
            </p>
          )}
          {cardNumber.length === 0 && (
            <p className="text-xs text-muted-foreground">
              For testing, use card number: 4242 4242 4242 4242
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date *</Label>
            <div className="relative">
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={handleExpiryChange}
                maxLength={5}
                disabled={isProcessingPayment}
              />
              {validation.expiry !== null && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validation.expiry ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {validation.expiry === false && expiryDate.length > 0 && (
              <p className="text-xs text-red-500">
                Please enter a valid expiry date (MM/YY)
                <br />
                Must be a future date in MM/YY format
              </p>
            )}
              {expiryDate.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  For testing, use any future date (e.g., 12/25)
                </p>
              )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvc">CVC *</Label>
            <div className="relative">
              <Input
                id="cvc"
                placeholder="123"
                value={cvc}
                onChange={handleCvcChange}
                maxLength={4}
                disabled={isProcessingPayment}
              />
              {validation.cvc !== null && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validation.cvc ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {validation.cvc === false && (
              <p className="text-xs text-red-500">
                Please enter a valid CVC (3-4 digits)
              </p>
            )}
            {cvc.length === 0 && (
              <p className="text-xs text-muted-foreground">
                For testing, use any 3 digits (e.g., 123)
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Status */}
      {paymentStatus !== 'idle' && (
        <div className={`p-4 rounded-lg ${
          paymentStatus === 'processing' ? 'bg-blue-50 text-blue-700' :
          paymentStatus === 'succeeded' ? 'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center">
            {paymentStatus === 'processing' && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                <p>Processing your payment...</p>
              </>
            )}
            {paymentStatus === 'succeeded' && (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                <p>Payment successful! Redirecting to confirmation...</p>
              </>
            )}
            {paymentStatus === 'failed' && (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                <p>Payment failed. Please try again.</p>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="pt-4">
        <Button 
          onClick={handlePayment} 
          disabled={isProcessingPayment || paymentStatus === 'succeeded' || !isFormValid()}
          className="w-full"
        >
          {isProcessingPayment ? (
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
          <Shield className="w-3 h-3 mr-1" />
          <span>Privacy Protected</span>
        </div>
      </div>
    </div>
  );
}