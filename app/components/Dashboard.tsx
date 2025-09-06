'use client';

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import AngularDifferenceChart from './AngularDifferenceChart';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface SystemData {
  frequency: number;
  timestamp: Date;
  status: string;
  regions: {
    [key: string]: {
      frequency: number;
      status: string;
    };
  };
}

interface DashboardProps {
  systemData: SystemData;
  pmuMeasurements?: any[];
  mapComponent?: React.ReactNode;
  chartComponent?: React.ReactNode;
}

export default function Dashboard({ systemData, pmuMeasurements, mapComponent, chartComponent }: DashboardProps) {
  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'status', x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 3 },
      { i: 'map', x: 6, y: 0, w: 6, h: 12, minW: 4, minH: 10 },
      { i: 'alerts', x: 0, y: 6, w: 6, h: 6, minW: 4, minH: 3 },
      { i: 'chart', x: 0, y: 12, w: 6, h: 12, minW: 6, minH: 10 },
      { i: 'angular', x: 6, y: 12, w: 6, h: 12, minW: 6, minH: 10 }
    ],
    md: [
      { i: 'status', x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 3 },
      { i: 'map', x: 6, y: 0, w: 6, h: 12, minW: 4, minH: 10 },
      { i: 'alerts', x: 0, y: 6, w: 6, h: 6, minW: 4, minH: 3 },
      { i: 'chart', x: 0, y: 12, w: 6, h: 12, minW: 6, minH: 10 },
      { i: 'angular', x: 6, y: 12, w: 6, h: 12, minW: 6, minH: 10 }
    ],
    sm: [
      { i: 'status', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'map', x: 0, y: 4, w: 6, h: 12, minW: 4, minH: 10 },
      { i: 'alerts', x: 0, y: 16, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'chart', x: 0, y: 20, w: 6, h: 12, minW: 6, minH: 10 },
      { i: 'angular', x: 0, y: 32, w: 6, h: 12, minW: 6, minH: 10 }
    ],
    xs: [
      { i: 'status', x: 0, y: 0, w: 4, h: 4, minW: 4, minH: 3 },
      { i: 'map', x: 0, y: 4, w: 4, h: 12, minW: 4, minH: 10 },
      { i: 'alerts', x: 0, y: 16, w: 4, h: 4, minW: 4, minH: 3 },
      { i: 'chart', x: 0, y: 20, w: 4, h: 12, minW: 4, minH: 10 },
      { i: 'angular', x: 0, y: 32, w: 4, h: 12, minW: 4, minH: 10 }
    ]
  });

  const onLayoutChange = (layout: any, layouts: any) => {
    setLayouts(layouts);
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={onLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={true}
        isResizable={true}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        dragHandleClassName="drag-handle"
        draggableCancel=".no-drag"
      >
        {/* Indicadores de Status */}
        <div key="status" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 drag-handle cursor-move">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              Indicadores de Status
            </h3>
          </div>
          
          <div className="p-3 no-drag overflow-y-auto h-full">
            {/* Status Geral */}
            <div className="mb-3">
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-green-700 dark:text-green-300">Status Geral</span>
                    </div>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                      NORMAL
                    </span>
                  </div>
                  
                  {/* Métricas */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                      <div className="text-blue-600 dark:text-blue-400 font-semibold">Frequência</div>
                      <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{systemData.frequency.toFixed(2)} Hz</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-2 border border-purple-200 dark:border-purple-800">
                      <div className="text-purple-600 dark:text-purple-400 font-semibold">Tensão</div>
                      <div className="text-lg font-bold text-purple-700 dark:text-purple-300">230.5 kV</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas do Sistema */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">Carga do Sistema</div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-1">85.2%</div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-[85.2%]"></div>
                  </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-2 border border-orange-200 dark:border-orange-800">
                <div className="text-orange-600 dark:text-orange-400 font-semibold mb-1">Qualidade de Energia</div>
                <div className="text-lg font-bold text-orange-700 dark:text-orange-300 mb-1">98.7%</div>
                <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full w-[98.7%]"></div>
                  </div>
              </div>
            </div>

            {/* PMUs e Conectividade */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-2 border border-emerald-200 dark:border-emerald-800">
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold mb-1">PMUs Ativas</div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mb-1">47/50</div>
                <div className="flex items-center space-x-1">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">Disponibilidade:</div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">94%</div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">Latência:</div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">12ms</div>
                </div>
                <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-2 mt-1">
                    <div className="bg-emerald-500 h-2 rounded-full w-[94%]"></div>
                  </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-2 border border-indigo-200 dark:border-indigo-800">
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold mb-1">Sincronismo GPS</div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300">SINCRONIZADO</div>
                </div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400">Precisão: ±1μs</div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400">Satélites: 12/12</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa do Sistema Elétrico */}
        <div key="map" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 px-4 py-3 drag-handle cursor-move flex-shrink-0">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              Mapa do Sistema Elétrico
            </h3>
          </div>
          
          <div className="flex-1 p-4 no-drag flex flex-col min-h-0">
             <div className="flex-1 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 shadow-inner border border-gray-200 dark:border-gray-600">
               {mapComponent ? (
                 <div className="h-full w-full">
                   {mapComponent}
                 </div>
               ) : (
                 <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                   <div className="text-center">
                     <div className="text-4xl mb-2">🗺️</div>
                     <div>Mapa do Brasil</div>
                     <div className="text-sm">Sistema Interligado Nacional</div>
                   </div>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Histórico de Frequência das PMUs */}
        <div key="chart" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-3 drag-handle cursor-move flex-shrink-0">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              Histórico de Frequência das PMUs
            </h3>
          </div>
          <div className="flex-1 p-4 no-drag flex flex-col min-h-0">
             <div className="flex-1 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 shadow-inner border border-gray-200 dark:border-gray-600 min-h-0">
              {chartComponent ? (
                <div className="h-full w-full">
                  {chartComponent}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <div>Gráfico de Frequência</div>
                    <div className="text-sm">Histórico das PMUs</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diferença Angular */}
        <div key="angular" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 px-4 py-3 drag-handle cursor-move flex-shrink-0">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              Diferença Angular
            </h3>
          </div>
          <div className="flex-1 p-4 no-drag flex flex-col min-h-0">
             <div className="flex-1 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 shadow-inner border border-gray-200 dark:border-gray-600 min-h-0">
              <AngularDifferenceChart pmuMeasurements={pmuMeasurements || []} />
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div key="alerts" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 drag-handle cursor-move">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              Alertas e Eventos
            </h3>
          </div>
          
          <div className="p-2 flex flex-col h-full no-drag">
            <div className="space-y-2 overflow-y-auto flex-1 min-h-[300px]">
              {/* Status Atual */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-2 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-green-700 dark:text-green-300">Sistema Interligado Nacional</span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                    NORMAL
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Todos os sistemas funcionando dentro dos parâmetros normais</p>
              </div>

              {/* Eventos Recentes */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <div className="w-1 h-4 bg-orange-500 rounded mr-2"></div>
                  Eventos Recentes
                </h4>
                
                <div className="space-y-1">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border-l-4 border-blue-400 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Manutenção Programada</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">14:30</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">PMU SE-001 offline por 15min - Atualização de firmware</p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border-l-4 border-yellow-400 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Variação de Frequência</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">13:45</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">Região Sul: 59.85 Hz por 2min - Dentro dos limites aceitáveis</p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border-l-4 border-green-400 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Sistema Restaurado</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">12:20</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">Todas as PMUs online - Conectividade 100% restaurada</p>
                  </div>
                </div>
              </div>

              {/* Estatísticas Operacionais */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <div className="w-1 h-4 bg-purple-500 rounded mr-2"></div>
                  Estatísticas (24h)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">0</div>
                    <div className="text-xs text-red-700 dark:text-red-300 font-medium">CRÍTICOS</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">3</div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">AVISOS</div>
                  </div>
                  <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">99.8%</div>
                    <div className="text-xs text-green-700 dark:text-green-300 font-medium">UPTIME</div>
                  </div>
                  <div className="text-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">2min</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">MTTR</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}