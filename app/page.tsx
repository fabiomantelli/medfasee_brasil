'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
// Lazy loading para componentes pesados - otimização de performance
const MemoizedDashboard = dynamic(() => import('./components/optimized/MemoizedDashboard'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>,
  ssr: false
});

// Importação direta para renderização instantânea
import RealBrazilMapComponent from './components/optimized/MemoizedRealBrazilMap';

const FrequencyChartComponent = dynamic(() => import('./components/optimized/MemoizedFrequencyChart'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg flex items-center justify-center"><span className="text-gray-500">📊 Carregando gráfico...</span></div>,
  ssr: false
});

// Importação direta para debug
import PlotlyAngularDifferenceChart from './components/optimized/PlotlyAngularDifferenceChart';

// const AngularDifferenceChartComponent = dynamic(() => import('./components/optimized/MemoizedAngularDifferenceChart'), {
//   loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg flex items-center justify-center"><span className="text-gray-500">📐 Carregando análise angular (Apache ECharts)...</span></div>,
//   ssr: false
// });

const MemoizedNotificationSystem = dynamic(() => import('./components/optimized/MemoizedNotificationSystem'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>,
  ssr: false
});

import dynamic from 'next/dynamic';
import { LoadingOverlay } from './components/ui/Loading';

// Teste direto sem dynamic import
import PMUInitializerDirect from './components/PMUInitializer';
//import DebugPanel from './components/DebugPanel';

const PMUInitializer = dynamic(() => import('./components/PMUInitializer'), {
  loading: () => <div style={{ display: 'none' }}>Carregando PMU...</div>,
  ssr: false
});

const DashboardLayout = dynamic(() => import('./components/server/DashboardLayout'), {
  loading: () => <div className="min-h-screen bg-gray-50 animate-pulse"></div>,
  ssr: false
});

// Dynamic imports for client-side components
// const PMUInitializer = dynamic(() => import('./components/PMUInitializer'), { ssr: false });
import { useDashboardInitialization, usePMUData, useLoadingState } from './hooks/useDashboard';
import { useDashboardStore } from './stores/dashboardStore';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Componente para renderizar timestamp apenas no cliente
const ClientTimestamp = () => {
  const [timestamp, setTimestamp] = useState('');
  
  useEffect(() => {
    setTimestamp(new Date().toLocaleString('pt-BR'));
  }, []);
  
  return <span>{timestamp}</span>;
};

type LayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
};

type DashboardLayouts = {
  lg: LayoutItem[];
  md: LayoutItem[];
  sm: LayoutItem[];
  xs: LayoutItem[];
};

export default function Home() {
  console.log('🔍 Page - Home component started, rendering PMUInitializer FIRST');
  console.log('🚀 Home - FUNÇÃO HOME EXECUTANDO - TESTE 2025');
  
  // Modern hooks for dashboard management
  const { isInitialized } = useDashboardInitialization();
  const { measurements, regionData, isRealDataConnected, stats } = usePMUData();
  const { isLoading } = useLoadingState();
  
  // RENDER PMUInitializer IMMEDIATELY - NO CONDITIONS
  console.log('🔍 Page - About to render PMUInitializer UNCONDITIONALLY');
  
  // PMU INITIALIZATION REMOVED - Now handled by PMUInitializer component only
  console.log('🚀 Page - PMU initialization delegated to PMUInitializer component');

  // Estado para layouts dos painéis redimensionáveis - otimizado para mobile 2025
  const [layouts, setLayouts] = useState<DashboardLayouts>({
    lg: [
      { i: 'dashboard', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
      { i: 'map', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
      { i: 'angular', x: 0, y: 10, w: 6, h: 10, minW: 4, minH: 8 },
      { i: 'frequency', x: 6, y: 10, w: 6, h: 10, minW: 4, minH: 8 },
      { i: 'notifications', x: 0, y: 20, w: 12, h: 6, minW: 4, minH: 2 }
    ],
    md: [
      { i: 'dashboard', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
      { i: 'map', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
      { i: 'angular', x: 0, y: 10, w: 6, h: 10, minW: 4, minH: 8 },
      { i: 'frequency', x: 6, y: 10, w: 6, h: 10, minW: 4, minH: 8 },
      { i: 'notifications', x: 0, y: 20, w: 12, h: 6, minW: 4, minH: 4 }
    ],
    sm: [
      { i: 'dashboard', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
      { i: 'map', x: 0, y: 8, w: 6, h: 10, minW: 4, minH: 6 },
      { i: 'frequency', x: 0, y: 16, w: 12, h: 8, minW: 4, minH: 6 },
      { i: 'angular', x: 0, y: 24, w: 6, h: 12, minW: 4, minH: 6 },
      { i: 'notifications', x: 0, y: 32, w: 6, h: 6, minW: 4, minH: 4 }
    ],
    xs: [
      { i: 'dashboard', x: 0, y: 0, w: 4, h: 8, minW: 4, minH: 4 },
      { i: 'map', x: 0, y: 6, w: 4, h: 10, minW: 4, minH: 4 },
      { i: 'frequency', x: 0, y: 12, w: 4, h: 12, minW: 4, minH: 4 },
      { i: 'angular', x: 0, y: 18, w: 4, h: 12, minW: 4, minH: 4 },
      { i: 'notifications', x: 0, y: 24, w: 4, h: 6, minW: 4, minH: 4 }
    ]
  });

  const onLayoutChange = (layout: unknown, layouts: DashboardLayouts) => {
    setLayouts(layouts);
    // Salvar no localStorage apenas no cliente para evitar erro de hidratação
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-layouts', JSON.stringify(layouts));
    }
  };

  // Carregar layouts salvos do localStorage apenas no cliente
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLayouts = localStorage.getItem('dashboard-layouts');
      if (savedLayouts) {
        try {
          setLayouts(JSON.parse(savedLayouts));
        } catch (error) {
          console.warn('Erro ao carregar layouts salvos:', error);
        }
      }
    }
  }, []);
  
  // Estado para controle de hidratação
  const [isClient, setIsClient] = useState(false);

  // Definir isClient apenas no cliente para evitar problemas de hidratação
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // System data derived from PMU measurements
  const systemData = React.useMemo(() => {
    // Usar timestamp em tempo real: UTC atual menos 5 segundos (conforme falha do webservice)
    const now = new Date();
    const fiveSecondsAgo = new Date(now.getTime() - 5000);
    const timestamp = isClient ? fiveSecondsAgo.toISOString() : '2024-01-01T00:00:00.000Z';
    
    if (!measurements || measurements.length === 0) {
      return {
        frequency: 0,
        timestamp,
        status: 'disconnected' as const,
        regions: {
          north: { frequency: 0, status: 'disconnected' as const },
          northeast: { frequency: 0, status: 'disconnected' as const },
          southeast: { frequency: 0, status: 'disconnected' as const },
          south: { frequency: 0, status: 'disconnected' as const },
          centerwest: { frequency: 0, status: 'disconnected' as const }
        }
      };
    }
    
    const avgFreq = measurements && measurements.length > 0
      ? measurements
          .filter((m: { frequency: number | null }) => m.frequency !== null)
          .reduce((sum: number, m: { frequency: number | null }) => sum + (m.frequency || 0), 0) / measurements.length
      : 60.0;
    
    let overallStatus: 'normal' | 'warning' | 'critical' = 'normal';
    if (Math.abs(avgFreq - 60) > 0.5) overallStatus = 'critical';
    else if (Math.abs(avgFreq - 60) > 0.2) overallStatus = 'warning';
    
    // Convert regionData array to object format expected by SystemData
    const regionsObject = regionData && Array.isArray(regionData) 
      ? regionData.reduce((acc, region) => {
          acc[region.region] = {
            frequency: region.frequency,
            status: region.status as 'normal' | 'warning' | 'critical' | 'disconnected'
          };
          return acc;
        }, {} as { [key: string]: { frequency: number; status: 'normal' | 'warning' | 'critical' | 'disconnected' } })
      : {
          north: { frequency: avgFreq, status: overallStatus },
          northeast: { frequency: avgFreq, status: overallStatus },
          southeast: { frequency: avgFreq, status: overallStatus },
          south: { frequency: avgFreq, status: overallStatus },
          centerwest: { frequency: avgFreq, status: overallStatus }
        };

    return {
      frequency: avgFreq,
      timestamp,
      status: overallStatus,
      regions: regionsObject
    };
  }, [measurements, regionData, isClient]);

  // Removed timestamp update interval to prevent infinite loops

  console.log('🔍 Page - Dashboard initialized:', isInitialized, 'Loading:', isLoading);
  console.log('🔍 Page - Stats:', stats);
  console.log('🔍 Page - Loading condition check:', isLoading && !isInitialized);

  // Direct PMUInitializer rendering without wrapper function
  console.log('🔍 Page - About to render PMUInitializer directly');

  // Temporarily disable loading condition to test PMUInitializer
  if (false && isLoading && !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <PMUInitializer />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Inicializando dashboard moderno...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Carregando dados PMU com Zustand</p>
        </div>
      </div>
    );
  }

  // Initialize PMU service component - FORÇAR RENDERIZAÇÃO
  console.log('🔍 Page - FORÇANDO renderização do PMUInitializer');
  console.log('🔍 Page - PMUInitializer component type:', PMUInitializer);
  
  // RENDER PMUInitializer FIRST - UNCONDITIONAL
  const pmuInitializer = <PMUInitializer />;
  
  console.log('🔍 Page - PMUInitializer component created:', pmuInitializer);
  console.log('🔍 Page - About to return JSX with PMUInitializer');
  
  return (
    <div>
      {/* DEBUG: Painel de debug */}
      {/*<DebugPanel />*/}
      {/* PMU Initializer - TESTE DIRETO SEM DYNAMIC */}
      <PMUInitializerDirect />
      {/* PMU Initializer - DEVE SER EXECUTADO PRIMEIRO */}
      <PMUInitializer />
      {pmuInitializer}
      <DashboardLayout currentPath="/" showMetrics={true}>
      <LoadingOverlay loading={isLoading} message="Carregando dados do dashboard...">
        <div className="space-y-6">
          {isRealDataConnected ? (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    Conectado aos dados reais das PMUs das Universidades Brasileiras
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    Usando dados simulados - Webservice externo não acessível (restrições CORS)
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Status do Dashboard Moderno */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard Projeto MedFasee BT</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Zustand Store • Custom Hooks • {stats.activePMUs}/{stats.totalPMUs} PMUs ativas
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isRealDataConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {isRealDataConnected ? 'Dados Reais' : 'Simulado'}
              </span>
            </div>
          </div>
        </div>

        {/* Layout Principal com Painéis Redimensionáveis - Mobile Optimized 2025 */}
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={onLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={typeof window !== 'undefined' && window.innerWidth > 768}
          isResizable={typeof window !== 'undefined' && window.innerWidth > 768}
          margin={typeof window !== 'undefined' && window.innerWidth <= 768 ? [8, 8] : [16, 16]}
          containerPadding={typeof window !== 'undefined' && window.innerWidth <= 768 ? [8, 8] : [0, 0]}
          draggableCancel=".no-drag"
        >
          {/* Dashboard Principal */}
          <div key="dashboard" className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-3 md:px-4 py-2 md:py-3 drag-handle cursor-move panel-header">
              <h3 className="text-sm md:text-lg font-semibold text-white flex items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                Dashboard Principal
              </h3>
            </div>
            <div className="p-2 md:p-4 pb-6 no-drag h-full overflow-hidden panel-content">
              <Suspense fallback={
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              }>
                <MemoizedDashboard systemData={systemData} />
              </Suspense>
            </div>
          </div>
          
          {/* Mapa do Brasil */}
          <div key="map" className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 px-3 md:px-4 py-2 md:py-3 drag-handle cursor-move panel-header">
              <h3 className="text-sm md:text-lg font-semibold text-white flex items-center">
                <div className="w-2 h-2 bg-cyan-300 rounded-full mr-2 animate-pulse"></div>
                Mapa do Sistema Elétrico
              </h3>
            </div>
            <div className="p-2 md:p-4 no-drag h-full overflow-hidden panel-content">
              <RealBrazilMapComponent />
            </div>
          </div>
          
          {/* Painel de Frequência */}
          <div key="frequency" className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-700 to-violet-800 px-3 md:px-4 py-2 md:py-3 drag-handle cursor-move panel-header">
              <h3 className="text-sm md:text-lg font-semibold text-white flex items-center">
                <div className="w-2 h-2 bg-violet-300 rounded-full mr-2 animate-pulse"></div>
                Histórico de Frequência
              </h3>
            </div>
            <div className="p-2 md:p-4 no-drag h-full overflow-hidden panel-content">
              <Suspense fallback={
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  }>
                    <FrequencyChartComponent />
                  </Suspense>
            </div>
          </div>
          
          {/* Painel de Diferença Angular */}
          <div key="angular" className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-amber-600 via-orange-700 to-red-700 px-3 md:px-4 py-2 md:py-3 drag-handle cursor-move panel-header">
              <h3 className="text-sm md:text-lg font-semibold text-white flex items-center">
                <div className="w-2 h-2 bg-amber-300 rounded-full mr-2 animate-pulse"></div>
                Diferença Angular
              </h3>
            </div>
            <div className="p-2 md:p-4 no-drag h-full overflow-hidden panel-content">
              <PlotlyAngularDifferenceChart systemData={systemData} />
            </div>
          </div>
          
          {/* Sistema de Notificações */}
          <div key="notifications" className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-rose-600 via-pink-700 to-fuchsia-800 px-3 md:px-4 py-2 md:py-3 drag-handle cursor-move panel-header">
              <h3 className="text-sm md:text-lg font-semibold text-white flex items-center">
                <div className="w-2 h-2 bg-rose-300 rounded-full mr-2 animate-pulse"></div>
                Notificações do Sistema
              </h3>
            </div>
            <div className="p-2 md:p-4 no-drag h-full overflow-hidden panel-content">
              <Suspense fallback={
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              }>
                <MemoizedNotificationSystem systemData={systemData} />
              </Suspense>
            </div>
          </div>
        </ResponsiveGridLayout>

        {/* Status geral do sistema */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status do Sistema
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
            Última atualização: <ClientTimestamp />
          </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 dark:text-green-400 font-medium">
                Sistema Interligado Nacional
              </span>
            </div>
          </div>
        </div>
        </div>
       </LoadingOverlay>
     </DashboardLayout>
   </div>
   );
}
