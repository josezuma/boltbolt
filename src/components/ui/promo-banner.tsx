import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface PromoBannerProps {
  className?: string;
}

export function PromoBanner({ className }: PromoBannerProps) {
  const [bannerText, setBannerText] = useState('Free shipping on all orders over $50');
  const [bannerLink, setBannerLink] = useState('/products');
  const [isVisible, setIsVisible] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    fetchPromoBanner();
  }, []);

  const fetchPromoBanner = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'promo_banner')
        .single();

      if (error) {
        console.error('Error fetching promo banner:', error);
        return;
      }

      if (data?.value) {
        const bannerSettings = data.value as {
          text: string;
          link: string;
          enabled: boolean;
        };

        setBannerText(bannerSettings.text || 'Free shipping on all orders over $50');
        setBannerLink(bannerSettings.link || '/products');
        setIsEnabled(bannerSettings.enabled !== false);
      }
    } catch (error) {
      console.error('Error processing promo banner data:', error);
    }
  };

  if (!isVisible || !isEnabled) {
    return null;
  }

  return (
    <div className={`promo-editorial relative ${className}`}>
      <div className="container-editorial py-3 text-center">
        <Link to={bannerLink} className="text-sm font-medium tracking-wide uppercase hover:underline">
          {bannerText}
        </Link>
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-background/70 hover:text-background transition-colors"
          aria-label="Close banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}