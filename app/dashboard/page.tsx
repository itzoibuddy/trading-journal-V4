// Add error boundary to catch and log errors
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';

export default function DashboardPage() {
  try {
    return (
      <ErrorBoundary fallback={<div className="p-4 bg-red-100 text-red-700 rounded-md">
        An error occurred loading the dashboard. Please check console logs for details.
      </div>}>
        <Suspense fallback={<div>Loading dashboard data...</div>}>
          {/* Existing dashboard content */}
          <div className="space-y-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {/* Dashboard content */}
          </div>
        </Suspense>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Dashboard render error:", error);
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        Failed to load dashboard. Error has been logged.
      </div>
    );
  }
} 