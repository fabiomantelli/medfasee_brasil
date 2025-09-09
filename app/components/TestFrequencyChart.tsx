'use client';

import React from 'react';

interface SystemData {
  frequency: number;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical' | 'disconnected';
  regions: {
    [key: string]: {
      frequency: number;
      status: 'normal' | 'warning' | 'critical' | 'disconnected';
    };
  };
}

interface TestFrequencyChartProps {
  systemData: SystemData;
}

const TestFrequencyChart = ({ systemData }: TestFrequencyChartProps) => {
  console.log('🧪 TestFrequencyChart - Componente inicializado com systemData:', systemData);
  
  return (
    <div className="p-4 bg-blue-100 border border-blue-300 rounded">
      <h3 className="text-lg font-bold text-blue-800">Teste FrequencyChart</h3>
      <p className="text-blue-600">Componente de teste funcionando!</p>
      <p className="text-sm text-blue-500">Frequência: {systemData.frequency} Hz</p>
      <p className="text-sm text-blue-500">Status: {systemData.status}</p>
    </div>
  );
};

export default TestFrequencyChart;