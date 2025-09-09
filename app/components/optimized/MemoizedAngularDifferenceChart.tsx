'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PMUMeasurement, VoltageData } from '../../services/pmuService';
import { usePMUData } from '../../hooks/useDashboard';

// Importação dinâmica do Plotly para evitar problemas de SSR
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false }) as any;

interface PolarData {
  r: number; // magnitude in pu
  theta: number; // angle in degrees
  name: string;
  pmuId: string;
  magnitude: number; // original magnitude in kV
  angle: number; // original angle in degrees
}

interface MemoizedAngularDifferenceChartProps {
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

/**
 * Componente de diferença angular otimizado para 2025
 * Sem React.memo para melhor performance com dados que mudam constantemente
 */
const AngularDifferenceChartComponent = ({ systemData }: MemoizedAngularDifferenceChartProps) => {
  // Hooks otimizados com seletores específicos
  const { measurements, isRealDataConnected } = usePMUData();
  
  const [selectedPMUs, setSelectedPMUs] = useState<Set<string>>(new Set());
  const [polarData, setPolarData] = useState<PolarData[]>([]);
  const [relativeAngles, setRelativeAngles] = useState<{ [key: string]: number }>({});
  const [referencePMU, setReferencePMU] = useState<string>('');
  const [availablePMUs, setAvailablePMUs] = useState<PMUMeasurement[]>([]);

  // Inicializar PMUs selecionadas (primeiras 5 por padrão)
  useEffect(() => {
    if (availablePMUs && availablePMUs.length > 0 && selectedPMUs.size === 0) {
      const initialPMUs = availablePMUs.slice(0, 5).map(pmu => pmu.pmuId);
      setSelectedPMUs(new Set(initialPMUs));
    }
  }, [availablePMUs]);

  // Processar dados de tensão quando as medições mudarem - otimizado
  useEffect(() => {
    if (!measurements?.length) {
      setPolarData([]);
      setAvailablePMUs([]);
      return;
    }
    
    // Filter PMUs com dados válidos de tensão
    const pmusWithVoltage = measurements.filter((pmu: PMUMeasurement) => 
      pmu.voltageA?.magnitude && pmu.voltageA.magnitude > 0 && 
      !isNaN(pmu.voltageA.magnitude) && 
      !isNaN(pmu.voltageA.angle)
    );
    
    setAvailablePMUs(pmusWithVoltage);
    
    // Processar dados polares
    const processedData: PolarData[] = pmusWithVoltage.map((pmu) => {
      const voltageA = pmu.voltageA!;
      // Tensão do webservice é fase-neutro, então dividir por (voltLevel / sqrt(3))
      const magnitudePU = voltageA.magnitude / (pmu.voltLevel / Math.sqrt(3));
      
      return {
        r: magnitudePU,
        theta: voltageA.angle,
        name: pmu.pmuName || `PMU ${pmu.pmuId}`,
        pmuId: pmu.pmuId,
        magnitude: voltageA.magnitude,
        angle: voltageA.angle
      };
    });
    
    setPolarData(processedData);
    
    // Auto-select first PMU as reference if none selected
    if (!referencePMU && processedData.length > 0) {
      setReferencePMU(processedData[0].pmuId);
    }
    
    // Remove PMUs selecionadas que não têm mais dados válidos
    setSelectedPMUs(prev => {
      const validPMUIds = new Set(processedData.map(data => data.pmuId));
      const filteredSelection = new Set(
        Array.from(prev).filter(pmuId => validPMUIds.has(pmuId))
      );
      return filteredSelection;
    });
  }, [measurements]);

  // Calcular ângulos relativos quando dados polares ou PMU de referência mudarem
  useEffect(() => {
    console.log('🔍 Angular Chart - relativeAngles useEffect triggered');
    console.log('🔍 Angular Chart - polarData length:', polarData.length);
    console.log('🔍 Angular Chart - referencePMU:', referencePMU);
    
    if (!polarData.length || !referencePMU) {
      console.log('🔍 Angular Chart - No data or reference PMU, clearing relative angles');
      setRelativeAngles({});
      return;
    }
    
    const referencePMUData = polarData.find(data => data.pmuId === referencePMU);
    if (!referencePMUData) {
      console.log('🔍 Angular Chart - Reference PMU not found in data');
      setRelativeAngles({});
      return;
    }
    
    const referenceAngle = referencePMUData.angle;
    console.log('🔍 Angular Chart - Reference angle:', referenceAngle);
    
    const newRelativeAngles: { [key: string]: number } = {};
    polarData.forEach(data => {
      let relativeAngle = data.angle - referenceAngle;
      // Normalize angle to [-180, 180]
      while (relativeAngle > 180) relativeAngle -= 360;
      while (relativeAngle < -180) relativeAngle += 360;
      newRelativeAngles[data.pmuId] = relativeAngle;
    });
    
    console.log('🔍 Angular Chart - New relative angles:', newRelativeAngles);
    setRelativeAngles(newRelativeAngles);
  }, [polarData, referencePMU]);

  const togglePMU = (pmuId: string) => {
    setSelectedPMUs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pmuId)) {
        newSet.delete(pmuId);
      } else {
        newSet.add(pmuId);
      }
      return newSet;
    });
  };

  // Cores para PMUs
  const PMU_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
    '#14b8a6', '#f43f5e', '#22c55e', '#a855f7', '#0ea5e9',
    '#eab308', '#dc2626', '#059669', '#7c3aed', '#0891b2'
  ];

  // Função para obter cor da PMU
  const getPMUColor = (pmuId: string): string => {
    const index = availablePMUs.findIndex(pmu => pmu.pmuId === pmuId);
    return PMU_COLORS[index % PMU_COLORS.length];
  };

  // Dados do gráfico polar otimizados com useMemo
  const plotData = useMemo(() => {
    console.log('🔍 Angular Chart - plotData useMemo triggered');
    console.log('🔍 Angular Chart - polarData length:', polarData.length);
    console.log('🔍 Angular Chart - selectedPMUs size:', selectedPMUs.size);
    console.log('🔍 Angular Chart - relativeAngles:', relativeAngles);
    
    if (!polarData.length || selectedPMUs.size === 0) {
      console.log('🔍 Angular Chart - No polar data, returning empty array');
      return [];
    }
    
    const selectedData = polarData.filter(data => selectedPMUs.has(data.pmuId));
    console.log('🔍 Angular Chart - Selected data length:', selectedData.length);
    
    if (selectedData.length === 0) {
      console.log('🔍 Angular Chart - No selected data, returning empty array');
      return [];
    }
    
    // Criar fasores como linhas do centro até o ponto (sem bolinhas)
    const traces = selectedData.flatMap(data => {
      const relativeAngle = relativeAngles[data.pmuId] || 0;
      const color = getPMUColor(data.pmuId);
      
      return [
        // Linha do fasor (do centro até o ponto)
        {
          type: 'scatterpolar',
          mode: 'lines',
          r: [0, data.r],
          theta: [relativeAngle, relativeAngle],
          line: {
            color: color,
            width: 3
          },
          showlegend: false,
          hovertemplate: `
            <b>${data.name}</b><br>
            Magnitude: ${data.r.toFixed(3)} pu<br>
            Ângulo Relativo: ${relativeAngle.toFixed(1)}°<br>
            <extra></extra>
          `,
          name: data.name
        }
      ];
    });
    
    console.log('🔍 Angular Chart - Generated traces:', traces.length);
    return traces;
  }, [polarData, selectedPMUs, relativeAngles, availablePMUs]);

  const layout = {
    polar: {
      bgcolor: 'rgba(0,0,0,0)',
      radialaxis: {
        visible: true,
        range: [0, 1.2],
        color: '#666666',
        gridcolor: 'rgba(102,102,102,0.4)',
        linecolor: 'rgba(102,102,102,0.6)',
        tickfont: { color: '#666666', size: 10 }
      },
      angularaxis: {
        visible: true,
        color: '#666666',
        gridcolor: 'rgba(102,102,102,0.4)',
        linecolor: 'rgba(102,102,102,0.6)',
        tickfont: { color: '#666666' },
        direction: 'counterclockwise',
        rotation: 0,
        tickmode: 'linear',
        tick0: 0,
        dtick: 30
      }
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#666666' },
    showlegend: false,
    margin: { t: 20, b: 20, l: 20, r: 20 }
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true
  };

  // Estado de carregamento - diferencia webservice desconectado vs aguardando PMUs
  if (!isRealDataConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Diferença Angular
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Fasores
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

  // Estado aguardando dados das PMUs (webservice conectado)
  if (!availablePMUs || availablePMUs.length === 0) {
    const pmuCount = measurements?.length || 0;
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Diferença Angular
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Fasores
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
            <p className="text-gray-600 text-sm mb-1">
              {pmuCount === 0 ? '⏳ Aguardando PMUs...' : '📊 Coletando dados angulares...'}
            </p>
            <p className="text-gray-500 text-xs">
              {pmuCount === 0 ? 'Nenhuma PMU enviando dados no momento' : `${pmuCount} PMU${pmuCount > 1 ? 's' : ''} conectada${pmuCount > 1 ? 's' : ''}, processando dados...`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado sem PMUs selecionadas
  if (selectedPMUs.size === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col items-center justify-center" style={{height: 'calc(100% - 4rem)'}}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione PMUs para Visualizar</h3>
          <p className="text-gray-600 mb-4">
            Escolha pelo menos uma PMU para ver a diferença angular no gráfico polar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Diferença Angular
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Polar
            </p>
          </div>
          <p className="text-xs text-gray-500">
            PMUs selecionadas: {selectedPMUs.size} • Referência: {referencePMU ? (availablePMUs.find(p => p.pmuId === referencePMU)?.pmuName || referencePMU) : 'Nenhuma'}
          </p>
        </div>
        
        {/* Seletor de PMU de referência */}
        <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
          <label className="text-sm font-medium text-gray-700 mb-2 block">PMU Referência:</label>
          <select
            value={referencePMU}
            onChange={(e) => setReferencePMU(e.target.value)}
            className="bg-white text-gray-900 px-3 py-2 rounded-lg text-sm border border-gray-300 focus:border-orange-500 focus:outline-none shadow-sm w-full"
          >
            {(availablePMUs || []).filter(pmu => selectedPMUs.has(pmu.pmuId)).map(pmu => (
              <option key={pmu.pmuId} value={pmu.pmuId}>
                {pmu.pmuName || `PMU ${pmu.pmuId}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seleção de PMUs */}
      <div className="mb-4 sm:mb-6 flex-shrink-0">
        <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Selecionar PMUs para Visualização
          </h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            {(availablePMUs || []).map((pmu, index) => {
              const isSelected = selectedPMUs.has(pmu.pmuId);
              const color = getPMUColor(pmu.pmuId);
              
              return (
                <button
                  key={pmu.pmuId}
                  onClick={() => togglePMU(pmu.pmuId)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1
                    ${isSelected 
                      ? 'text-white shadow-md transform scale-105' 
                      : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                    }
                  `}
                  style={{
                    backgroundColor: isSelected ? color : undefined,
                    borderColor: isSelected ? color : undefined
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: isSelected ? 'white' : color }}
                  ></div>
                  <span>{pmu.pmuName || `PMU ${pmu.pmuId}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Área do gráfico */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-4 border border-gray-200 shadow-inner overflow-hidden">
        <div className="w-full h-full">
          <Plot
            data={plotData}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* Informações do gráfico */}
      <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Magnitudes normalizadas (pu)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Ângulos relativos à referência</span>
            </div>
          </div>
          <div className="text-right">
            <span>Referência: <span className="text-orange-600 font-medium">{availablePMUs.find(p => p.pmuId === referencePMU)?.pmuName || referencePMU}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

AngularDifferenceChartComponent.displayName = 'AngularDifferenceChartComponent';

export default AngularDifferenceChartComponent;