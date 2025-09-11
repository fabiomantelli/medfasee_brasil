'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { usePMUData } from '../../hooks/useDashboard';

// Importar Plotly dinamicamente para evitar problemas de SSR
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Cores para PMUs
const PMU_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#f43f5e', '#22c55e', '#a855f7', '#0ea5e9',
  '#eab308', '#dc2626', '#059669', '#7c3aed', '#0891b2'
];

interface PlotlyAngularDifferenceChartProps {
  systemData?: {
    frequency: number;
    timestamp: string;
    status: 'normal' | 'warning' | 'critical' | 'disconnected';
    regions: {
      [key: string]: {
        frequency: number;
        status: 'normal' | 'warning' | 'critical' | 'disconnected';
      };
    };
  };
}

const PlotlyAngularDifferenceChart: React.FC<PlotlyAngularDifferenceChartProps> = ({ systemData }) => {
  console.log('🎯🎯🎯 PLOTLY ANGULAR - COMPONENTE INICIADO! 🎯🎯🎯');
  console.log('🎯🎯🎯 PLOTLY ANGULAR - TIMESTAMP:', new Date().toISOString());
  console.log('🎯🎯🎯 PLOTLY ANGULAR - systemData:', systemData);
  
  const [isClient, setIsClient] = useState(false);
  const [selectedPMUs, setSelectedPMUs] = useState<string[]>([]);
  const [referencePMU, setReferencePMU] = useState<string>('');
  
  // Usar o hook de dados PMU
  const { measurements, allMeasurements, isRealDataConnected } = usePMUData();
  
  console.log('🔥🔥🔥 PLOTLY ANGULAR - Hook usePMUData result:');
  console.log('🔥🔥🔥 PLOTLY ANGULAR - measurements:', measurements?.length || 0);
  console.log('🔥🔥🔥 PLOTLY ANGULAR - allMeasurements:', allMeasurements?.length || 0);
  console.log('🔥🔥🔥 PLOTLY ANGULAR - isRealDataConnected:', isRealDataConnected);
  
  // Para o gráfico angular, usar allMeasurements para incluir PMUs disconnected também
  const pmuData = allMeasurements && allMeasurements.length > 0 ? allMeasurements : measurements;
  
  console.log('🔥🔥🔥 PLOTLY ANGULAR - pmuData after hook:', pmuData?.length || 0);
  
  // Client-side mounting detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Process voltage data for polar chart
  const polarData = useMemo(() => {
    console.log('🔍🔍🔍 PLOTLY ANGULAR - PROCESSANDO DADOS POLARES!');
    console.log('🔍 PLOTLY ANGULAR - pmuData:', pmuData);
    console.log('🔍 PLOTLY ANGULAR - pmuData length:', pmuData?.length || 0);
    
    if (!pmuData || pmuData.length === 0) {
      console.log('🔍 PLOTLY ANGULAR - No pmuData available');
      return [];
    }
    
    console.log('🔍 PLOTLY ANGULAR - Processing voltage data for', pmuData.length, 'PMUs');
    console.log('🔍 PLOTLY ANGULAR - First PMU sample:', pmuData[0]);
    
    // Filter PMUs with valid voltage data
    const validPMUs = pmuData.filter(pmu => {
      console.log(`🔍 Checking PMU ${pmu.pmuId}:`, {
        voltageA: pmu.voltageA,
        hasVoltageA: !!pmu.voltageA,
        magnitude: pmu.voltageA?.magnitude,
        angle: pmu.voltageA?.angle,
        magnitudeType: typeof pmu.voltageA?.magnitude,
        angleType: typeof pmu.voltageA?.angle
      });
      
      const hasVoltageA = pmu.voltageA && 
                         typeof pmu.voltageA.magnitude === 'number' && 
                         typeof pmu.voltageA.angle === 'number' &&
                         !isNaN(pmu.voltageA.magnitude) && 
                         !isNaN(pmu.voltageA.angle) &&
                         pmu.voltageA.magnitude > 0;
      
      if (hasVoltageA) {
        console.log(`✅ PMU ${pmu.pmuId}: Magnitude=${pmu.voltageA!.magnitude}, Angle=${pmu.voltageA!.angle}`);
      } else {
        console.log(`❌ PMU ${pmu.pmuId}: Invalid voltage data`, pmu.voltageA);
      }
      
      return hasVoltageA;
    });
    
    console.log(`📊📊📊 PLOTLY ANGULAR - Found ${validPMUs.length} PMUs with valid voltage data`);
    
    const result = validPMUs.map(pmu => {
      // Calculate magnitude in PU (per unit) - Fórmula correta: tensão(módulo) / (tensão_base / sqrt(3))
      // Exemplo: 132V / (220V / sqrt(3)) = 1.039 pu
      const baseVoltageLineToNeutral = pmu.voltLevel / Math.sqrt(3); // Tensão fase-neutro em kV
      const magnitudePU = pmu.voltageA!.magnitude / baseVoltageLineToNeutral;
      
      console.log(`📊 PMU ${pmu.pmuId}: Magnitude=${pmu.voltageA!.magnitude}kV, Base=${pmu.voltLevel}kV, BaseL-N=${baseVoltageLineToNeutral.toFixed(3)}kV, PU=${magnitudePU.toFixed(3)}`);
      
      return {
        r: magnitudePU, // magnitude in per unit
        theta: pmu.voltageA!.angle, // angle in degrees
        name: pmu.pmuName || pmu.pmuId,
        pmuId: pmu.pmuId,
        magnitude: pmu.voltageA!.magnitude, // original magnitude in kV
        angle: pmu.voltageA!.angle, // original angle in degrees
        station: pmu.station,
        state: pmu.state,
        voltLevel: pmu.voltLevel
      };
    });
    
    console.log('📊📊📊 PLOTLY ANGULAR - Final polarData result:', result);
    return result;
  }, [pmuData]);

  // Inicializar PMUs selecionadas (primeiras 5 por padrão)
  useEffect(() => {
    if (polarData && polarData.length > 0 && selectedPMUs.length === 0) {
      const initialPMUs = polarData.slice(0, 5).map(pmu => pmu.pmuId);
      setSelectedPMUs(initialPMUs);
    }
  }, [polarData, selectedPMUs.length]);

  // Auto-select first PMU as reference if none selected
  useEffect(() => {
    if (!referencePMU && polarData.length > 0) {
      setReferencePMU(polarData[0].pmuId);
    }
  }, [polarData, referencePMU]);

  // Calculate relative angles when polar data or reference PMU changes
  const relativeAngles = useMemo(() => {
    if (!polarData.length || !referencePMU) {
      return {};
    }
    
    const referencePMUData = polarData.find(data => data.pmuId === referencePMU);
    if (!referencePMUData) {
      return {};
    }
    
    const referenceAngle = referencePMUData.angle;
    const angles: { [key: string]: number } = {};
    
    polarData.forEach(data => {
      let relativeAngle = data.angle - referenceAngle;
      // Normalize angle to [-180, 180]
      while (relativeAngle > 180) relativeAngle -= 360;
      while (relativeAngle < -180) relativeAngle += 360;
      angles[data.pmuId] = relativeAngle;
    });
    
    return angles;
  }, [polarData, referencePMU]);

  const togglePMU = useCallback((pmuId: string) => {
    setSelectedPMUs(prev => 
      prev.includes(pmuId) 
        ? prev.filter(id => id !== pmuId)
        : [...prev, pmuId]
    );
  }, []);

  const getPMUColor = useCallback((pmuId: string): string => {
    const pmuIndex = polarData.findIndex(pmu => pmu.pmuId === pmuId);
    return PMU_COLORS[pmuIndex % PMU_COLORS.length];
  }, [polarData]);

  // Preparar dados para Plotly com fasores verdadeiros
  const { plotlyData, plotlyAnnotations } = useMemo(() => {
    console.log('🔍 PLOTLY ANGULAR - plotlyData useMemo triggered');
    console.log('🔍 PLOTLY ANGULAR - polarData length:', polarData.length);
    console.log('🔍 PLOTLY ANGULAR - selectedPMUs:', selectedPMUs);
    console.log('🔍 PLOTLY ANGULAR - relativeAngles:', relativeAngles);
    
    if (!polarData.length || selectedPMUs.length === 0) {
      console.log('🔍 PLOTLY ANGULAR - No polar data, returning empty');
      return { plotlyData: [], plotlyAnnotations: [] };
    }
    
    const selectedData = polarData.filter(data => selectedPMUs.includes(data.pmuId));
    console.log('🔍 PLOTLY ANGULAR - Selected data length:', selectedData.length);
    
    if (selectedData.length === 0) {
      console.log('🔍 PLOTLY ANGULAR - No selected data');
      return { plotlyData: [], plotlyAnnotations: [] };
    }
    
    // Criar dados para cada PMU selecionada como fasores verdadeiros
    const traces = selectedData.map(data => {
      const relativeAngle = relativeAngles[data.pmuId] || 0;
      const color = getPMUColor(data.pmuId);
      
      // Usar magnitude já em pu calculada anteriormente
      const magnitudePU = data.r; // Já calculado em pu no polarData
      
      // Criar múltiplos pontos ao longo da linha para melhor hover
      const numPoints = 20;
      const rValues = [];
      const thetaValues = [];
      
      for (let i = 0; i <= numPoints; i++) {
        rValues.push((i / numPoints) * magnitudePU);
        thetaValues.push(relativeAngle);
      }
      
      return {
        type: 'scatterpolar' as const,
        mode: 'lines+markers' as const,
        r: rValues,
        theta: thetaValues,
        line: {
          color: color,
          width: 2
        },
        marker: {
          color: color,
          size: 2,
          opacity: 0.1 // Marcadores quase invisíveis
        },
        name: data.name,
        hoverlabel: {
            bgcolor: color,
            bordercolor: 'white',
            font: { color: 'white', size: 12 }
          },
          hovertemplate: `<b>${data.name}</b><br>` +
                        `Magnitude: ${data.magnitude.toFixed(0)} V<br>` +
                        `Ângulo: ${relativeAngle.toFixed(1)}°<br>` +
                        `Magnitude (pu): ${magnitudePU.toFixed(4)} pu<br>` +
                        `<extra></extra>`,
        showlegend: false
      };
    });
    
    // Sem anotações de setas - vetores simples
    const annotations: Array<{
      x: number;
      y: number;
      text: string;
      showarrow: boolean;
      arrowhead?: number;
      ax?: number;
      ay?: number;
    }> = [];
    
    console.log('📊📊📊 PLOTLY ANGULAR - Final traces:', traces);
    return { plotlyData: traces, plotlyAnnotations: annotations };
  }, [polarData, selectedPMUs, relativeAngles, getPMUColor]);
  
  // Retornar mensagem se não há conexão com webservice
  if (!isRealDataConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Diferença Angular
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Fasores de Tensão
            </p>
          </div>
        </div>
        
        <div className="flex-1 relative bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-1 border border-red-200 shadow-inner overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 text-sm mb-1">🔌 Webservice indisponível</p>
            <p className="text-red-500 text-xs">
              Não é possível exibir dados de tensão sem conexão real
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state only when client is not ready
  if (!isClient) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center justify-center" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Carregando gráfico...</p>
        </div>
      </div>
    );
  }
  
  // Layout do Plotly otimizado para fasores com suporte a anotações
  const plotlyLayout = {
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 1.3],
        showticklabels: true,
        tickfont: { size: 10, color: '#666' },
        gridcolor: '#e0e0e0',
        linecolor: '#ccc'
      },
      angularaxis: {
        visible: true,
        tickmode: 'linear' as const,
        tick0: 0,
        dtick: 30,
        direction: 'counterclockwise' as const,
        rotation: 0, // 0° à direita
        tickfont: { size: 10, color: '#666' },
        gridcolor: '#e0e0e0',
        linecolor: '#ccc'
      },
      bgcolor: 'rgba(248, 249, 250, 0.8)'
    },
    // Adicionar eixos cartesianos ocultos para suporte às anotações
    xaxis: {
      visible: false,
      range: [-1.3, 1.3]
    },
    yaxis: {
      visible: false,
      range: [-1.3, 1.3]
    },
    showlegend: false,
    legend: {
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(255, 255, 255, 0.9)',
      bordercolor: '#ddd',
      borderwidth: 1
    },
    margin: { t: 20, b: 20, l: 20, r: 20 },
    font: { family: 'Inter, system-ui, sans-serif', size: 12 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    annotations: plotlyAnnotations || [],
    autosize: true,
    hovermode: 'closest' as const,

    hoverdistance: 50
  };
  
  // Show loading state only when client is not ready
  if (!isClient) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Diferença Angular
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Carregando...
            </p>
          </div>
        </div>
        
        <div className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-1 border border-slate-300 shadow-inner overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Carregando componente...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Filter selected data
  const selectedData = polarData.filter(data => selectedPMUs.includes(data.pmuId));
  
  console.log('🔍 PLOTLY Debug - polarData.length:', polarData.length);
  console.log('🔍 PLOTLY Debug - selectedPMUs:', selectedPMUs);
  console.log('🔍 PLOTLY Debug - selectedData.length:', selectedData.length);
  console.log('🔍 PLOTLY Debug - measurements?.length:', measurements?.length);
  
  // Show waiting message when no PMUs are selected or no data available
  if (selectedData.length === 0) {
    const pmuCount = measurements?.length || 0;
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Diferença Angular
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Fasores de Tensão
            </p>
          </div>
        </div>
        
        <div className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-1 border border-slate-300 shadow-inner overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-600 mb-2">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 0 01-2-2z" />
              </svg>
            </div>
            {pmuCount === 0 ? (
              <>
                <p className="text-gray-600 text-sm mb-1">⏳ Aguardando PMUs...</p>
                <p className="text-gray-500 text-xs">
                  Nenhuma PMU enviando dados no momento
                </p>
              </>
            ) : polarData.length === 0 ? (
              <>
                <p className="text-gray-600 text-sm mb-1">📊 Coletando dados de tensão...</p>
                <p className="text-gray-500 text-xs">
                  {pmuCount} PMU{pmuCount > 1 ? 's' : ''} conectada{pmuCount > 1 ? 's' : ''}, aguardando dados de tensão...
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 text-sm mb-1">📐 Nenhuma PMU selecionada</p>
                <p className="text-gray-500 text-xs">
                  Selecione PMUs para visualizar os fasores de tensão
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Diferença Angular
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Polar
            </p>
          </div>
          <p className="text-xs text-gray-500">
            PMUs conectadas: {measurements?.length || 0}
          </p>
          <p className="pt-1 text-xs text-gray-500">
            Com tensão: {polarData.length}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-3 w-full sm:w-[27.3rem] border border-gray-200 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              Selecionar PMUs para Visualização
            </h4>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const allPMUIds = (polarData || []).map(pmu => pmu.pmuId);
                  setSelectedPMUs(allPMUIds);
                }}
                className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-colors duration-200"
              >
                Habilitar todas
              </button>
              <button
                onClick={() => {
                  setSelectedPMUs([]);
                  // Após desabilitar todas, selecionar as 5 primeiras por padrão
                  setTimeout(() => {
                    const firstFivePMUs = (polarData || []).slice(0, 5).map(pmu => pmu.pmuId);
                    setSelectedPMUs(firstFivePMUs);
                  }, 100);
                }}
                className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors duration-200"
              >
                Desabilitar todas
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin p-1">
            {(polarData || []).map((pmu, index) => {
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
                    <span>{pmu.name || `${pmu.pmuId}`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* PMU Referência */}
      <div className="flex justify-start mb-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-3 border border-gray-200 shadow-inner w-full sm:w-[26rem]">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            PMU Referência
          </h4>
          <select
            value={referencePMU}
            onChange={(e) => setReferencePMU(e.target.value)}
            className="bg-white text-gray-900 px-2 py-1.5 rounded-lg text-sm border border-gray-300 focus:border-purple-500 focus:outline-none shadow-sm w-full"
          >
            {(polarData || []).filter(pmu => selectedPMUs.includes(pmu.pmuId)).map(pmu => (
              <option key={pmu.pmuId} value={pmu.pmuId}>
                {pmu.name || `PMU ${pmu.pmuId}`}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Área do gráfico */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-4 border border-gray-200 shadow-inner overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full h-full max-w-full max-h-full">
            {isClient && (
              <Plot
                data={plotlyData}
                layout={plotlyLayout}
                style={{ width: '100%', height: '100%' }}
                config={{
                  displayModeBar: false,
                  responsive: true
                }}
                useResizeHandler={true}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Informações do gráfico */}
      <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Magnitudes normalizadas (pu)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span>Ângulos relativos à referência</span>
            </div>
          </div>
          <div className="text-right">
            <span>Referência: <span className="text-purple-600 font-medium">{polarData.find(p => p.pmuId === referencePMU)?.name || referencePMU}</span></span>
          </div>
        </div>
      </div>
      

    </div>
  );
};

PlotlyAngularDifferenceChart.displayName = 'PlotlyAngularDifferenceChart';

export default PlotlyAngularDifferenceChart;