'use client';

import { useEffect } from 'react';
import { Chart, registerables } from 'chart.js';

export default function ChartRegistry() {
  useEffect(() => {
    // Register all Chart.js components including the Filler plugin
    Chart.register(...registerables);
  }, []);

  return null; // This component doesn't render anything
} 