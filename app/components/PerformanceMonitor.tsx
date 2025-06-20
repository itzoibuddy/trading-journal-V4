'use client';

import { useEffect } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  route: string;
  timestamp: number;
}

export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // Monitor page load performance
    const measurePagePerformance = () => {
      if ('performance' in window) {
        const loadTime = performance.timing?.loadEventEnd - performance.timing?.navigationStart;
        const renderTime = performance.timing?.domContentLoadedEventEnd - performance.timing?.domContentLoadedEventStart;
        
        const metrics: PerformanceMetrics = {
          loadTime,
          renderTime,
          route: window.location.pathname,
          timestamp: Date.now(),
        };

        // Only send if metrics are valid
        if (loadTime > 0 && loadTime < 60000) { // Less than 60 seconds
          try {
            fetch('/api/analytics/performance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metrics),
            }).catch(() => {
              // Silently fail
            });
          } catch {
            // Silently fail
          }
        }
      }
    };

    // Measure performance after page load
    if (document.readyState === 'complete') {
      measurePagePerformance();
    } else {
      window.addEventListener('load', measurePagePerformance);
    }

    // Monitor route changes (for SPA navigation)
    const handleRouteChange = () => {
      setTimeout(measurePagePerformance, 100);
    };

    // Listen to browser navigation events
    window.addEventListener('popstate', handleRouteChange);

    // Cleanup
    return () => {
      window.removeEventListener('load', measurePagePerformance);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return null; // This component doesn't render anything
}