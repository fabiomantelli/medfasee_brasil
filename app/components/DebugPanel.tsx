'use client';

import React from 'react';
import { useDashboardStore } from '../stores/dashboardStore';

const DebugPanel = () => {
  const { 
    pmuService, 
    isRealDataConnected, 
    pmuMeasurements, 
    stats,
    setPmuService,
    setIsRealDataConnected 
  } = useDashboardStore();

  const handleReset = () => {
    console.log('🔴 DEBUG - Resetando store completo');
    setPmuService(null);
    setIsRealDataConnected(false);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <h4>🔧 Debug Panel</h4>
      <div>PMU Service: {pmuService ? '✅ Existe' : '❌ Null'}</div>
      <div>Real Data Connected: {isRealDataConnected ? '✅ True' : '❌ False'}</div>
      <div>PMU Measurements: {pmuMeasurements?.length || 0}</div>
      <div>Active PMUs: {stats.activePMUs}</div>
      <div>Avg Frequency: {stats.averageFrequency.toFixed(3)}Hz</div>
      <div>Last Update: {stats.lastUpdate}</div>
      <button 
        onClick={handleReset}
        style={{
          background: 'red',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        🔄 RESET & RELOAD
      </button>
    </div>
  );
};

export default DebugPanel;