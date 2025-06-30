import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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

interface ShippingFormProps {
  shippingAddress: ShippingAddress;
  setShippingAddress: (address: ShippingAddress) => void;
  onSubmit: (e: React.FormEvent) => void;
  userId?: string;
}

export function ShippingForm({ 
  shippingAddress, 
  setShippingAddress, 
  onSubmit,
  userId 
}: ShippingFormProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserAddress();
    }
  }, [userId]);

  const loadUserAddress = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Check if user has a customer profile
      const { data: profile, error: profileError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no profile exists
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching customer profile:', profileError);
      }
      
      // If no profile exists, create one
      if (!profile) {
        try {
          const { error: insertError } = await supabase
            .from('customer_profiles')
            .insert([{ id: userId }])
            .select();
            
          if (insertError) {
            // If it's a duplicate key error, we can ignore it (someone else created it)
            if (insertError.code !== '23505') { // 23505 is the Postgres error code for unique_violation
              console.error('Error creating customer profile:', insertError);
            }
          }
        } catch (err) {
          console.error('Exception creating customer profile:', err);
        }
      }
      
      // Get default shipping address
      const { data: addresses, error: addressError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .eq('address_type', 'shipping')
        .maybeSingle();
      
      if (addressError && addressError.code !== 'PGRST116') {
        console.error('Error fetching address:', addressError);
        return;
      }
      
      if (addresses) {
        setShippingAddress({
          firstName: addresses.first_name,
          lastName: addresses.last_name,
          address: addresses.address_line1,
          city: addresses.city,
          state: addresses.state,
          zipCode: addresses.postal_code,
          country: addresses.country,
          phone: addresses.phone || ''
        });
      }
    } catch (error) {
      console.error('Error loading user address:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={shippingAddress.firstName}
            onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={shippingAddress.lastName}
            onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Street Address *</Label>
        <Input
          id="address"
          value={shippingAddress.address}
          onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={shippingAddress.city}
            onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State/Province *</Label>
          <Input
            id="state"
            value={shippingAddress.state}
            onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
          <Input
            id="zipCode"
            value={shippingAddress.zipCode}
            onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <select
            id="country"
            value={shippingAddress.country}
            onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
            className="w-full h-10 px-3 border border-input bg-background rounded-none"
            required
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={shippingAddress.phone}
          onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
        />
      </div>
      
      <div className="pt-4">
        <Button type="submit" className="w-full">
          Continue to Payment
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}