'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PMUMeasurement, VoltageData } from '../services/pmuService';

// Importação dinâmica do Plotly para evitar problemas de SSR
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PolarData {
  r: number; // magnitude in pu
  theta: number; // angle in degrees
  name: string;
  pmuId: string;
  magnitude: number; // original magnitude in kV
  angle: number; // original angle in degrees
}

interface AngularDifferenceChartProps {
  pmuMeasurements: PMUMeasurement[];
}

const AngularDifferenceChart: React.FC<AngularDifferenceChartProps> = ({ pmuMeasurements }) => {
  const [selectedPMUs, setSelectedPMUs] = useState<Set<string>>(new Set());
  const [polarData, setPolarData] = useState<PolarData[]>([]);
  const [relativeAngles, setRelativeAngles] = useState<{ [key: string]: number }>({});
  const [referencePMU, setReferencePMU] = useState<string>('');
  const [availablePMUs, setAvailablePMUs] = useState<PMUMeasurement[]>([]);
  const [loading, setLoading] = useState(false);

  // Inicializar PMUs selecionadas (primeiras 5 por padrão)
  useEffect(() => {
    if (availablePMUs.length > 0 && selectedPMUs.size === 0) {
      const initialPMUs = availablePMUs.slice(0, 5).map(pmu => pmu.pmuId);
      setSelectedPMUs(new Set(initialPMUs));
    }
  }, [availablePMUs, selectedPMUs.size]);

  // Processar dados de tensão quando as medições mudarem
  useEffect(() => {
    if (pmuMeasurements && pmuMeasurements.length > 0) {
      // Filter PMUs that have voltage A data
      const pmusWithVoltage = pmuMeasurements.filter(pmu => pmu.voltageA);
      setAvailablePMUs(pmusWithVoltage);
      
      const processedData: PolarData[] = pmusWithVoltage.map((pmu) => {
        const voltageA = pmu.voltageA!;
        // Convert magnitude to pu (assuming voltLevel is the base voltage in kV)
        const magnitudePU = voltageA.magnitude / pmu.voltLevel;
        
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
      
      // Auto-select all PMUs initially
      if (selectedPMUs.size === 0 && processedData.length > 0) {
        setSelectedPMUs(new Set(processedData.map(p => p.pmuId)));
      }
    }
  }, [pmuMeasurements]);

  // Calcular ângulos relativos quando a PMU de referência mudar
  useEffect(() => {
    if (polarData.length > 0 && referencePMU) {
      const referenceData = polarData.find(p => p.pmuId === referencePMU);
      if (referenceData) {
        const referenceAngle = referenceData.angle;
        const relativeAnglesMap: { [key: string]: number } = {};
        
        polarData.forEach(pmu => {
          let relativeAngle = pmu.angle - referenceAngle;
          // Normalize angle to [-180, 180] range
          while (relativeAngle > 180) relativeAngle -= 360;
          while (relativeAngle < -180) relativeAngle += 360;
          relativeAnglesMap[pmu.pmuId] = relativeAngle;
        });
        
        setRelativeAngles(relativeAnglesMap);
      }
    }
  }, [polarData, referencePMU]);

  // Função para alternar seleção de PMUs
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

  // Array de cores para as PMUs (mesmo padrão do FrequencyChart)
  const PMU_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
    '#14b8a6', '#f43f5e', '#22c55e', '#a855f7', '#0ea5e9',
    '#eab308', '#dc2626', '#059669', '#7c3aed', '#0891b2'
  ];

  // Função para obter cor consistente da PMU
  const getPMUColor = (pmuId: string): string => {
    const index = availablePMUs.findIndex(pmu => pmu.pmuId === pmuId);
    return PMU_COLORS[index % PMU_COLORS.length];
  };

  // Gerar dados para o gráfico polar
  const plotData = useMemo(() => {
    if (polarData.length === 0) return [];

    const selectedData = polarData.filter(pmu => selectedPMUs.has(pmu.pmuId));
    
    return selectedData.map((pmu) => {
      const relativeAngle = relativeAngles[pmu.pmuId] || 0;

      return {
        type: 'scatterpolar' as const,
        mode: 'markers+text' as const,
        r: [pmu.r], // Magnitude in pu
        theta: [relativeAngle], // Relative angle
        text: [`${pmu.name}\n${pmu.r.toFixed(2)} pu\n${relativeAngle.toFixed(1)}°`],
        textposition: 'middle center' as const,
        name: pmu.name,
        marker: {
          size: 12,
          color: getPMUColor(pmu.pmuId)
        },
        showlegend: false,
        hovertemplate: `<b>%{fullData.name}</b><br>` +
                      `Magnitude: %{r:.3f} pu<br>` +
                      `Ângulo: %{theta:.1f}°<br>` +
                      `<extra></extra>`
      };
    });
  }, [polarData, selectedPMUs, relativeAngles, availablePMUs]);

  const layout = {
    title: {
      text: `Diferença Angular das PMUs${referencePMU ? ` (Ref: ${availablePMUs.find(p => p.pmuId === referencePMU)?.pmuName || referencePMU})` : ''}`,
      font: { color: '#FFFFFF', size: 18 }
    },
    polar: {
      bgcolor: 'rgba(0,0,0,0)',
      radialaxis: {
        visible: true,
        range: [0, polarData.length > 0 ? Math.max(1.2, Math.max(...polarData.map(p => p.r)) * 1.1) : 1.2],
        color: '#FFFFFF',
        gridcolor: 'rgba(255,255,255,0.2)',
        linecolor: 'rgba(255,255,255,0.2)',
        tickfont: { color: '#FFFFFF' },
        title: {
          text: 'Magnitude (pu)',
          font: { color: '#FFFFFF' }
        }
      },
      angularaxis: {
        visible: true,
        color: '#FFFFFF',
        gridcolor: 'rgba(255,255,255,0.2)',
        linecolor: 'rgba(255,255,255,0.2)',
        tickfont: { color: '#FFFFFF' },
        direction: 'counterclockwise',
        rotation: 0,
        tickmode: 'linear',
        tick0: 0,
        dtick: 30
      }
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#FFFFFF' },
    showlegend: false,
    margin: { t: 50, b: 50, l: 50, r: 50 }
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true
  };

  if (selectedPMUs.size === 0) {
    return (
      <div className="flex-1 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Diferença Angular</h2>
        <div className="flex items-center justify-center h-64 text-gray-400">
          Selecione PMUs para visualizar os sincrofasores
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Diferença Angular</h2>
        
        {/* Seletor de PMU de referência */}
        <div className="flex items-center space-x-2">
          <label className="text-white text-sm">PMU Referência:</label>
          <select
            value={referencePMU}
            onChange={(e) => setReferencePMU(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {availablePMUs.map(pmu => (
              <option key={pmu.pmuId} value={pmu.pmuId}>
                {pmu.pmuName || `PMU ${pmu.pmuId}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controles de seleção de PMUs */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 sm:p-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecionar PMUs para Visualização
          </h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {availablePMUs.map((pmu, index) => {
              const isSelected = selectedPMUs.has(pmu.pmuId);
              const color = getPMUColor(pmu.pmuId);
              
              return (
                <button
                  key={pmu.pmuId}
                  onClick={() => togglePMU(pmu.pmuId)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 hover:scale-105 ${
                    isSelected 
                      ? 'text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600'
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
                    <span>{pmu.pmuName || `PMU ${pmu.pmuId}`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-10 rounded">
            <div className="text-white">Carregando dados...</div>
          </div>
        )}
        
        <div className="w-full h-96">
          <Plot
            data={plotData}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="mt-4 text-sm text-gray-300">
        <p>• Magnitudes normalizadas em pu (por unidade)</p>
        <p>• Ângulos relativos à PMU de referência: <span className="text-blue-400">{availablePMUs.find(p => p.pmuId === referencePMU)?.pmuName || referencePMU}</span></p>
        <p>• Dados atualizados em tempo real</p>
      </div>
    </div>
  );
};

export default AngularDifferenceChart;