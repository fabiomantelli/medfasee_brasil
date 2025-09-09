'use client';

import React, { useEffect, useState } from 'react';
import { usePMUData } from '../../hooks/useDashboard';

interface PMUDataPoint {
  timestamp: Date;
  frequency: number;
  pmuId: string;
}

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

interface MemoizedFrequencyChartProps {
  systemData: SystemData;
}

const PMU_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#f43f5e', '#22c55e', '#a855f7', '#0ea5e9',
  '#eab308', '#dc2626', '#059669', '#7c3aed', '#0891b2'
];

// Component without React.memo for better performance with constantly changing data
const FrequencyChartComponent = ({ systemData }: MemoizedFrequencyChartProps) => {
  const { measurements, isRealDataConnected } = usePMUData();
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [availablePMUs, setAvailablePMUs] = useState<{ id: string; name: string; frequency: number }[]>([]);
  const [selectedPMUs, setSelectedPMUs] = React.useState<string[]>([]);
  const [pmuData, setPmuData] = useState<Record<string, PMUDataPoint[]>>({});
  
  // Responsive dimensions based on container - moved to top
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 400 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient) return;
    
    setCurrentTime(new Date());
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualizar a cada minuto
    
    return () => clearInterval(interval);
  }, [isClient]);

  // Update dimensions on resize
  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(400, rect.width - 16),
          height: Math.max(300, rect.height - 16)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const maxPoints = 30; // Máximo de 30 pontos na tela

  // Initialize selected PMUs with useMemo to prevent unnecessary re-renders
  const initialPMUs = React.useMemo(() => {
    if (measurements && measurements.length > 0) {
      // Filtrar PMUs com dados válidos
      const validPMUs = measurements.filter(pmu => 
        pmu.frequency && 
        pmu.frequency > 0 && 
        !isNaN(pmu.frequency) &&
        pmu.status === 'active'
      );
      
      if (validPMUs.length > 0) {
        return validPMUs.slice(0, 5).map(pmu => pmu.pmuId);
      }
    }
    // Only use real data from webservice - no test data fallback
    return [];
  }, [measurements]);

  // Initialize selected PMUs once when measurements are available
  useEffect(() => {
    if (initialPMUs.length > 0 && selectedPMUs.length === 0) {
      setSelectedPMUs(initialPMUs);
    }
  }, [initialPMUs, selectedPMUs.length]);

  // Update available PMUs when measurements change
  React.useEffect(() => {
    if (measurements && measurements.length > 0) {
      // Filtrar PMUs com dados válidos
      const validPMUs = measurements.filter(pmu => 
        pmu.frequency && 
        pmu.frequency > 0 && 
        !isNaN(pmu.frequency) &&
        pmu.status === 'active'
      );
      
      if (validPMUs.length > 0) {
        setAvailablePMUs(validPMUs);
      }
    } else {
      setAvailablePMUs([]);
    }
  }, [measurements]);

  // Sistema de buffer circular - reage às mudanças dos dados do PMUService
  React.useEffect(() => {
    if (!availablePMUs?.length) {
      setPmuData({});
      return;
    }
    
    console.log('📊 FrequencyChart - Atualizando buffer circular para', availablePMUs.length, 'PMUs');
    
    // Atualizar dados sempre que availablePMUs mudar (sincronizado com PMUService)
    setPmuData(prevData => {
      const newData = { ...prevData };
      const timestamp = new Date();
      
      availablePMUs.forEach((pmu) => {
        if (!newData[pmu.pmuId]) {
          newData[pmu.pmuId] = [];
        }
        
        // Verificar se é um novo ponto (evitar duplicatas)
        const lastPoint = newData[pmu.pmuId][newData[pmu.pmuId].length - 1];
        const timeDiff = lastPoint ? timestamp.getTime() - lastPoint.timestamp.getTime() : Infinity;
        
        // Só adicionar se passou pelo menos 4 segundos desde o último ponto (tolerância para timing)
        if (timeDiff > 4000) {
          const newPoint: PMUDataPoint = {
            timestamp,
            frequency: pmu.frequency,
            pmuId: pmu.pmuId
          };
          
          newData[pmu.pmuId] = [...newData[pmu.pmuId], newPoint];
          
          // Manter apenas os últimos 30 pontos (buffer circular)
          if (newData[pmu.pmuId].length > maxPoints) {
            newData[pmu.pmuId] = newData[pmu.pmuId].slice(-maxPoints);
          }
          
          console.log(`📊 PMU ${pmu.pmuId}: ${newData[pmu.pmuId].length} pontos no buffer (${pmu.frequency.toFixed(3)}Hz)`);
        } else {
          console.log(`📊 PMU ${pmu.pmuId}: Ignorando ponto duplicado (${timeDiff}ms desde último)`);
        }
      });
      
      return newData;
    });
  }, [availablePMUs, maxPoints]);

  // Remove selected PMUs that no longer have valid data
   React.useEffect(() => {
     if (Object.keys(pmuData).length > 0) {
       setSelectedPMUs(prev => {
         const validPMUIds = Object.keys(pmuData);
         const filtered = prev.filter(pmuId => validPMUIds.includes(pmuId));
         return filtered.length > 0 ? filtered : prev;
       });
     }
   }, [pmuData]);

  const togglePMU = (pmuId: string) => {
    setSelectedPMUs(prev => {
      if (prev.includes(pmuId)) {
        return prev.filter(id => id !== pmuId);
      } else {
        return [...prev, pmuId];
      }
    });
  };

  // Process data for chart rendering
  const chartData = React.useMemo(() => {
    if (!pmuData || Object.keys(pmuData).length === 0) {
      return [];
    }

    const allTimestamps = new Set<number>();
    Object.values(pmuData).forEach(pmuPoints => {
      pmuPoints.forEach(point => allTimestamps.add(point.timestamp.getTime()));
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
    
    return sortedTimestamps.map(timestamp => {
      const dataPoint: Record<string, number | Date> = { timestamp: new Date(timestamp) };
      
      selectedPMUs.forEach(pmuId => {
        if (pmuData[pmuId]) {
          const point = pmuData[pmuId].find(p => p.timestamp.getTime() === timestamp);
          if (point) {
            dataPoint[pmuId] = point.frequency;
          }
        }
      });
      
      return dataPoint;
    });
  }, [pmuData, selectedPMUs]);

  const selectedData = selectedPMUs
    .map(pmuId => ({ pmuId, data: pmuData[pmuId] || [] }))
    .filter(item => item.data.length > 0);

  // Show loading state only when webservice is truly unavailable
  if (!isClient || !isRealDataConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Frequência
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Hz
            </p>
          </div>
        </div>
        
        <div className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-1 border border-slate-300 shadow-inner overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-600 mb-2">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm mb-1">🔌 Webservice indisponível</p>
            <p className="text-gray-500 text-xs">
              Aguardando conexão com o servidor de dados...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show waiting message when webservice is connected but no chart data yet
  if (selectedData.length === 0) {
    const pmuCount = measurements?.length || 0;
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Frequência
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Hz
            </p>
          </div>
        </div>
        
        <div className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-1 border border-slate-300 shadow-inner overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-600 mb-2">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            {pmuCount === 0 ? (
              <>
                <p className="text-gray-600 text-sm mb-1">⏳ Aguardando PMUs...</p>
                <p className="text-gray-500 text-xs">
                  Nenhuma PMU enviando dados no momento
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 text-sm mb-1">📊 Coletando dados de frequência...</p>
                <p className="text-gray-500 text-xs">
                  {pmuCount} PMU{pmuCount > 1 ? 's' : ''} conectada{pmuCount > 1 ? 's' : ''}, construindo histórico...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { width, height } = dimensions;
  const padding = Math.min(60, width * 0.08); // Responsive padding

  // Calculate frequency range
  const allFrequencies = selectedData.flatMap(item => 
    (item.data || []).map(point => point.frequency)
  ).filter(freq => !isNaN(freq));
  
  const minFreq = Math.min(...allFrequencies, 59.5);
  const maxFreq = Math.max(...allFrequencies, 60.5);
  const freqRange = maxFreq - minFreq;
  const freqPadding = freqRange * 0.1;
  const adjustedMinFreq = minFreq - freqPadding;
  const adjustedMaxFreq = maxFreq + freqPadding;

  // Scale functions
  const getX = (index: number) => {
    const maxIndex = Math.max(...selectedData.map(item => (item.data?.length || 0) - 1));
    return padding + ((width - 2 * padding) * index) / Math.max(maxIndex, 1);
  };

  const getY = (frequency: number) => {
    return height - padding - ((height - 2 * padding) * (frequency - adjustedMinFreq)) / (adjustedMaxFreq - adjustedMinFreq);
  };

  // Get PMU name from available PMUs - similar to AngularDifferenceChart
  const getPMUName = (pmuId: string) => {
    const pmu = availablePMUs.find(p => p.pmuId === pmuId);
    if (pmu) {
      return pmu.pmuName || `${pmu.station} (${pmu.state})` || `PMU ${pmu.pmuId}`;
    }
    return pmuId;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Frequência
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Hz
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Últimas {maxPoints} medições • Atualizado: {isClient ? currentTime.toLocaleTimeString('pt-BR') : '--:--:--'}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-3 w-full sm:w-96 border border-gray-200 shadow-inner">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Selecionar PMUs para Visualização
          </h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin">
            {availablePMUs.map((pmu, index) => {
              const isSelected = selectedPMUs.includes(pmu.pmuId);
              const color = PMU_COLORS[index % PMU_COLORS.length];
              
              return (
                <button
                  key={pmu.pmuId}
                  onClick={() => togglePMU(pmu.pmuId)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 hover:scale-105 ${
                    isSelected 
                      ? 'text-white shadow-md' 
                      : 'text-gray-600 bg-white hover:bg-gray-100 shadow-sm border border-gray-200'
                  }`}
                  style={isSelected ? { backgroundColor: color } : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <div 
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white/80' : 'bg-current opacity-50'
                      }`}
                      style={!isSelected ? { backgroundColor: color } : undefined}
                    ></div>
                    <span>{getPMUName(pmu.pmuId)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-1 border border-gray-200 shadow-inner overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Grid lines and gradients */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>

          </defs>


          
          {/* Reference lines */}
          <g>
            {/* 60Hz reference line */}
            <line 
              x1={padding} 
              y1={getY(60)} 
              x2={width - padding} 
              y2={getY(60)} 
              stroke="#10b981" 
              strokeWidth="2" 
              strokeDasharray="8,4" 

            />
            <text 
              x={width - padding + 10} 
              y={getY(60) + 4} 
              className="fill-emerald-600 text-sm font-medium"
            >
              60.0 Hz
            </text>
            
            {/* Additional reference lines */}
            <line 
              x1={padding} 
              y1={getY(59.9)} 
              x2={width - padding} 
              y2={getY(59.9)} 
              stroke="#f59e0b" 
              strokeWidth="1" 
              strokeDasharray="4,2" 

            />
            <line 
              x1={padding} 
              y1={getY(60.1)} 
              x2={width - padding} 
              y2={getY(60.1)} 
              stroke="#f59e0b" 
              strokeWidth="1" 
              strokeDasharray="4,2" 

            />
          </g>
          
          {/* PMU lines */}
          {(selectedData || []).map((item, pmuIndex) => {
            const color = PMU_COLORS[(measurements || []).findIndex(p => p.pmuId === item.pmuId) % PMU_COLORS.length];
            
            const pathData = (item.data || []).map((point, index) => {
              const x = getX(index);
              const y = getY(point.frequency);
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ');
            
            return (
              <g key={`${item.pmuId}-${pmuIndex}`}>

                {/* Main line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className=""
                />
                {/* Data points */}
                {(item.data || []).map((point, index) => {
                  const x = getX(index);
                  const y = getY(point.frequency);
                  const isLast = index === (item.data?.length || 0) - 1;
                  
                  return (
                    <g key={`${item.pmuId}-point-${index}`}>



                      {/* Main point */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isLast ? "5" : "3"}
                        fill={color}
                        stroke="rgba(255, 255, 255, 0.9)"
                        strokeWidth={isLast ? "2" : "1"}
                        className={`${isLast ? "animate-pulse" : "hover:scale-125 transition-all duration-200"}`}
                      />
                      {/* Inner core */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isLast ? "2" : "1"}
                        fill="rgba(255, 255, 255, 0.95)"
                        className=""
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
          
          {/* Y-axis */}
          <g>
            {/* Y-axis line */}
            <line 
              x1={padding} 
              y1={padding} 
              x2={padding} 
              y2={height - padding} 
              stroke="#64748b" 
              strokeWidth="2"
            />
            
            {/* Y-axis ticks and labels */}
            {(() => {
              const range = adjustedMaxFreq - adjustedMinFreq;
              const step = range / 4; // 5 markers total
              const markers = [];
              
              for (let i = 0; i <= 4; i++) {
                const freq = adjustedMinFreq + (step * i);
                markers.push(freq);
              }
              
              return markers.map((freq, index) => {
                const y = getY(freq);
                
                return (
                  <g key={`${freq}-${index}`}>
                    {/* Tick mark */}
                    <line 
                      x1={padding - 5} 
                      y1={y} 
                      x2={padding} 
                      y2={y} 
                      stroke="#64748b" 
                      strokeWidth="1"
                    />
                    {/* Label */}
                    <text 
                      x={padding - 10} 
                      y={y + 4} 
                      textAnchor="end" 
                      className="fill-slate-600 font-medium"
                      fontSize={Math.max(10, width * 0.015)}
                    >
                      {freq.toFixed(2)}
                    </text>
                  </g>
                );
              });
            })()}
            
            {/* Y-axis label removed */}
          </g>
          
          {/* X-axis */}
          <g>
            {/* X-axis line */}
            <line 
              x1={padding} 
              y1={height - padding} 
              x2={width - padding} 
              y2={height - padding} 
              stroke="#64748b" 
              strokeWidth="2"
            />
            
            {/* X-axis ticks and labels */}
            {(() => {
              const maxDataLength = Math.max(...selectedData.map(item => item.data?.length || 0));
              const step = Math.max(1, Math.floor(maxDataLength / 5));
              const ticks = [];
              
              for (let i = 0; i < maxDataLength; i += step) {
                ticks.push(i);
              }
              if (ticks[ticks.length - 1] !== maxDataLength - 1) {
                ticks.push(maxDataLength - 1);
              }
              
              return ticks.map((index) => {
                const x = getX(index);
                const dataPoint = selectedData[0]?.data?.[index];
                const timestamp = dataPoint?.timestamp;
                
                return (
                  <g key={`tick-${index}`}>
                    {/* Tick mark */}
                    <line 
                      x1={x} 
                      y1={height - padding} 
                      x2={x} 
                      y2={height - padding + 5} 
                      stroke="#64748b" 
                      strokeWidth="1"
                    />
                    {/* Label */}
                    <text 
                      x={x} 
                      y={height - padding + 18} 
                      textAnchor="middle" 
                      className="fill-slate-600"
                      fontSize={Math.max(9, width * 0.012)}
                    >
                      {timestamp ? `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}` : '--:--:--'}
                    </text>
                  </g>
                );
              });
            })()}
            
            {/* X-axis label removed */}
          </g>
        </svg>
      </div>
      
      {/* Informações do gráfico */}
      <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Frequência do sistema: 60 Hz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

FrequencyChartComponent.displayName = 'FrequencyChartComponent';

export default FrequencyChartComponent;