'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    // Log the error to an error reporting service
    console.error('Error boundary caught error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Send to logging service if available
    if (typeof window !== 'undefined') {
      // Log to browser console in detail
      console.group('Detailed Error Information');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Component stack:', errorInfo.componentStack);
      console.groupEnd();
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