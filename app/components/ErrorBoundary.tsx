'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Only log detailed errors in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error boundary caught error:', error);
      console.error('Component stack:', errorInfo.componentStack);
      
      if (typeof window !== 'undefined') {
        console.group('Detailed Error Information');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Component stack:', errorInfo.componentStack);
        console.groupEnd();
      }
    }
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Send minimal error info to external service
      try {
        // Example: Send to error tracking service like Sentry
        // Sentry.captureException(error, { extra: errorInfo });
        
        // Or send to your own logging endpoint
        fetch('/api/error-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          }),
        }).catch(() => {
          // Silently fail if error tracking fails
        });
      } catch {
        // Silently fail if error tracking fails
      }
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 