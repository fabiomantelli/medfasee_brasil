'use client';

import React from 'react';
import { useDashboardStore } from '../../stores/dashboardStore';

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

interface MemoizedDashboardProps {
  systemData: SystemData;
  mapComponent?: React.ReactNode;
  chartComponent?: React.ReactNode;
  angularComponent?: React.ReactNode;
}

/**
 * Dashboard moderno 2025 conectado ao store centralizado
 * Sem React.memo - dados mudam constantemente a cada 5 segundos
 */
const MemoizedDashboard = ({ 
  systemData,
  mapComponent,
  chartComponent,
  angularComponent
}: MemoizedDashboardProps) => {
  // Use Zustand store directly
  const { stats, pmuMeasurements, isRealDataConnected } = useDashboardStore();
  
  // Calcular métricas em tempo real do store centralizado com memoização
  const systemHealth = stats.averageFrequency > 0 ? 'healthy' : 'disconnected';
  
  const healthColor = React.useMemo(() => ({
    healthy: 'green',
    warning: 'yellow', 
    critical: 'red',
    disconnected: 'gray'
  }[systemHealth]), [systemHealth]);
  
  const healthLabel = React.useMemo(() => ({
    healthy: 'NORMAL',
    warning: 'ATENÇÃO',
    critical: 'CRÍTICO', 
    disconnected: 'DESCONECTADO'
  }[systemHealth]), [systemHealth]);
  
  console.log('🔍 MemoizedDashboard - Modern 2025 Dashboard rendered');
  console.log('🔍 MemoizedDashboard - Stats from centralized store:', stats);
  console.log('🔍 MemoizedDashboard - PMU Measurements from store:', pmuMeasurements?.length || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 p-6">
      {/* Card de Status Geral */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Status do Sistema</h3>
          <div className={`w-3 h-3 bg-${healthColor}-500 rounded-full animate-pulse`}></div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${healthColor}-100 text-${healthColor}-800`}>
              {healthLabel}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Frequência Média:</span>
            <span className="font-semibold text-blue-600">{(stats.averageFrequency || 0).toFixed(2)} Hz</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">PMUs Ativas:</span>
            <span className="font-semibold text-green-600">{pmuMeasurements?.length || 0}/{pmuMeasurements?.length || 0}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Conectividade:</span>
            <span className={`font-semibold ${isRealDataConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isRealDataConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Card de Mapa */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Mapa do Sistema</h3>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="h-48 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          {mapComponent ? (
            <div className="w-full h-full">{mapComponent}</div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-3xl mb-2">🗺️</div>
              <div className="text-sm">Mapa do Sistema Elétrico</div>
            </div>
          )}
        </div>
      </div>

      {/* Card de Gráfico de Frequência */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Histórico de Frequência</h3>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="h-48 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          {chartComponent ? (
            <div className="w-full h-full">{chartComponent}</div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm">Gráfico de Frequência</div>
            </div>
          )}
        </div>
      </div>

      {/* Card de Diferença Angular */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Diferença Angular</h3>
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="h-48 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          {angularComponent ? (
            <div className="w-full h-full">{angularComponent}</div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-3xl mb-2">📐</div>
              <div className="text-sm">Módulo e Ângulo da Tensão Fase A</div>
            </div>
          )}
        </div>
      </div>

      {/* Card de Alertas e Estatísticas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-red-500 lg:col-span-2 xl:col-span-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Alertas e Estatísticas</h3>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{pmuMeasurements?.length || 0}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Total PMUs</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{pmuMeasurements?.length || 0}</div>
            <div className="text-sm text-green-700 dark:text-green-300">PMUs Ativas</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{(stats.averageFrequency || 0).toFixed(1)}Hz</div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Freq. Média</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Tentativas</div>
          </div>
        </div>
        
        {/* Erro se houver */}
        {!isRealDataConnected && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Erro de Conectividade</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Sem conexão com dados reais</p>
          </div>
        )}
        
        {/* Última atualização */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Última atualização: {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString() : 'Nunca'}
        </div>
      </div>
    </div>
  );
};

MemoizedDashboard.displayName = 'MemoizedDashboard';

export default MemoizedDashboard;