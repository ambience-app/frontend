'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { reportWebVitals, trackPageLoad } from '@/lib/performance';

export function PerformanceMonitor() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page load performance
    if (typeof window !== 'undefined') {
      // Report Web Vitals
      reportWebVitals((metric) => {
        // You can send this to any analytics service
        console.log(metric);
        
        // Example: Send to Google Analytics
        if (window.gtag) {
          window.gtag('event', metric.name, {
            event_category: 'Web Vitals',
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_label: metric.id,
            non_interaction: true,
          });
        }
      });

      // Track initial page load
      trackPageLoad();
    }
  }, []);

  useEffect(() => {
    // Track route changes
    const handleRouteChange = () => {
      trackPageLoad();
    };

    // Listen for route changes
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    handleRouteChange();

    // Cleanup
    return () => {
      // Any cleanup if needed
    };
  }, [pathname, searchParams]);

  return null;
}
