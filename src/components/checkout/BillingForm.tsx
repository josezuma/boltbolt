import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface BillingFormProps {
  billingInfo: BillingInfo;
  handleBillingChange: (field: keyof BillingInfo, value: string | boolean) => void;
  isProcessingPayment: boolean;
}

export function BillingForm({ 
  billingInfo, 
  handleBillingChange,
  isProcessingPayment
}: BillingFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="sameAsShipping"
          checked={billingInfo.sameAsShipping}
          onChange={(e) => handleBillingChange('sameAsShipping', e.target.checked)}
          className="rounded border-gray-300"
          disabled={isProcessingPayment}
        />
        <Label htmlFor="sameAsShipping">
          Billing address same as shipping
        </Label>
      </div>
      
      {!billingInfo.sameAsShipping && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingFirstName">First Name *</Label>
              <Input
                id="billingFirstName"
                value={billingInfo.firstName}
                onChange={(e) => handleBillingChange('firstName', e.target.value)}
                required
                disabled={isProcessingPayment}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingLastName">Last Name *</Label>
              <Input
                id="billingLastName"
                value={billingInfo.lastName}
                onChange={(e) => handleBillingChange('lastName', e.target.value)}
                required
                disabled={isProcessingPayment}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="billingAddress">Street Address *</Label>
            <Input
              id="billingAddress"
              value={billingInfo.address}
              onChange={(e) => handleBillingChange('address', e.target.value)}
              required
              disabled={isProcessingPayment}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingCity">City *</Label>
              <Input
                id="billingCity"
                value={billingInfo.city}
                onChange={(e) => handleBillingChange('city', e.target.value)}
                required
                disabled={isProcessingPayment}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingState">State/Province *</Label>
              <Input
                id="billingState"
                value={billingInfo.state}
                onChange={(e) => handleBillingChange('state', e.target.value)}
                required
                disabled={isProcessingPayment}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingZipCode">ZIP/Postal Code *</Label>
              <Input
                id="billingZipCode"
                value={billingInfo.zipCode}
                onChange={(e) => handleBillingChange('zipCode', e.target.value)}
                required
                disabled={isProcessingPayment}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingCountry">Country *</Label>
              <select
                id="billingCountry"
                value={billingInfo.country}
                onChange={(e) => handleBillingChange('country', e.target.value)}
                className="w-full h-10 px-3 border border-input bg-background rounded-none"
                required
                disabled={isProcessingPayment}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}