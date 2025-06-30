import { useEffect } from 'react';

interface GoogleAnalyticsProps {
  trackingId?: string;
}

export function GoogleAnalytics({ trackingId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (!trackingId || typeof window === 'undefined') return;

    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script1);

    // Initialize Google Analytics
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${trackingId}');
    `;
    document.head.appendChild(script2);

    return () => {
      // Cleanup scripts on unmount
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [trackingId]);

  return null;
}

// Helper function to track events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Helper function to track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', 'GA_TRACKING_ID', {
      page_path: url,
      page_title: title,
    });
  }
};