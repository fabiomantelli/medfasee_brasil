'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePMUData } from '../../hooks/useDashboard';

// Dynamic import with SSR disabled for Leaflet
const RealBrazilMap = dynamic(() => import('../RealBrazilMap'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
  )
});

// Component without React.memo for better performance with constantly changing data
const RealBrazilMapComponent = () => {
  console.log('🗺️ RealBrazilMapComponent - Rendering with optimized architecture (no memo)');
  console.log('🗺️ RealBrazilMapComponent - Using internal selectors and TanStack Query');
  
  // Use optimized hooks internally
  const { measurements, stats } = usePMUData();
  
  console.log('🗺️ RealBrazilMapComponent - Data from optimized hooks:', {
    measurementsCount: measurements?.length || 0,
    activePMUs: stats.activePMUs,
    totalPMUs: stats.totalPMUs
  });
  
  return (
    <div className="w-full h-full">
      <RealBrazilMap />
    </div>
  );
};

RealBrazilMapComponent.displayName = 'RealBrazilMapComponent';

export default RealBrazilMapComponent;