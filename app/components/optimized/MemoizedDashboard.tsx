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
const MemoizedDashboard = ({}: MemoizedDashboardProps) => {
  // Usar dados centralizados do Zustand store
  const { stats, pmuMeasurements, isRealDataConnected } = useDashboardStore();
  
  const totalPMUs = stats.totalPMUs;
  const activePMUs = stats.activePMUs;
  
  console.log('🔍 MemoizedDashboard - Modern 2025 Dashboard rendered');
  console.log('🔍 MemoizedDashboard - Stats from centralized store:', stats);
  console.log('🔍 MemoizedDashboard - PMU Measurements from store:', pmuMeasurements?.length || 0);
  console.log('🔍 MemoizedDashboard - Real data connected:', isRealDataConnected);

  // Estado de desconexão quando webservice não está disponível
  if (!isRealDataConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-slate-700 to-slate-900 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Alertas e Estatísticas
            </h3>
          </div>
        </div>
        
        <div className="flex-1 relative bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-1 border border-red-200 overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 text-sm mb-1">🔌 Webservice indisponível</p>
            <p className="text-red-500 text-xs">
              Não é possível exibir dados sem conexão real
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de carregamento quando não há PMUs conectadas
  if (activePMUs === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-slate-700 to-slate-900 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Alertas e Estatísticas
            </h3>
          </div>
        </div>
        
        <div className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-1 border border-slate-300 overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-600 mb-2">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm mb-1">⏳ Aguardando PMUs...</p>
            <p className="text-gray-500 text-xs">
              Nenhuma PMU enviando dados no momento
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
      {/* Cabeçalho do painel */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-slate-700 to-slate-900 rounded-full animate-pulse"></div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            Alertas e Estatísticas
          </h3>
        </div>
      </div>
      
      {/* Área do conteúdo */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-4 border border-gray-200 shadow-inner overflow-hidden">
        <div className="w-full h-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{totalPMUs}</div>
              <div className="text-sm text-gray-600 font-medium">Total PMUs</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-green-200">
              <div className="text-2xl font-bold text-green-700">{activePMUs}</div>
              <div className="text-sm text-gray-600 font-medium">PMUs Ativas</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{(stats.averageFrequency || 0).toFixed(1)}Hz</div>
              <div className="text-sm text-gray-600 font-medium">Frequência</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">0</div>
              <div className="text-sm text-gray-600 font-medium">Tentativas</div>
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
            Última atualização: {stats.lastUpdate || 'Nunca'}
          </div>
        </div>
      </div>
      
      {/* Informações do painel */}
      <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>PMUs conectadas</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Dados em tempo real</span>
            </div>
          </div>
          <div className="text-right">
            <span>Status: <span className="text-green-600 font-medium">{isRealDataConnected ? 'Online' : 'Offline'}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

MemoizedDashboard.displayName = 'MemoizedDashboard';

export default MemoizedDashboard;