'use client';

// LOG FORÇADO NO TOPO DO ARQUIVO
console.log('🔥🔥🔥 ANGULAR APACHE - ARQUIVO CARREGADO! 🔥🔥🔥');
console.log('🔥🔥🔥 ANGULAR APACHE - TIMESTAMP LOAD:', new Date().toISOString());

import React, { useState, useEffect, useMemo, useLayoutEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PMUMeasurement } from '../../services/pmuService';
import { usePMUData } from '../../hooks/useDashboard';

// Dynamic import do ECharts para otimização
const ReactECharts = dynamic(() => import('echarts-for-react'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg flex items-center justify-center"><span className="text-gray-500">📐 Carregando ECharts...</span></div>,
  ssr: false
});

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

// Cores para PMUs (movido para fora do componente para evitar recriação)
const PMU_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#f43f5e', '#22c55e', '#a855f7', '#0ea5e9',
  '#eab308', '#dc2626', '#059669', '#7c3aed', '#0891b2'
];

interface AngularDifferenceChartProps {
  systemData?: any;
}

const AngularDifferenceChartComponent: React.FC<AngularDifferenceChartProps> = ({ systemData }) => {
  // TODOS OS HOOKS DEVEM VIR PRIMEIRO - ANTES DE QUALQUER RETURN CONDICIONAL
  const [isClient, setIsClient] = useState(false);
  const [selectedPMUs, setSelectedPMUs] = useState<string[]>([]);
  const [referencePMU, setReferencePMU] = useState<string>('');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [revision, setRevision] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Refs para controle de redimensionamento
  const plotContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Usar o mesmo hook que o FrequencyChart usa para obter dados do webservice
  const { measurements, allMeasurements, isRealDataConnected } = usePMUData();
  
  // Para o gráfico angular, usar allMeasurements para incluir PMUs disconnected também
  let pmuData = allMeasurements && allMeasurements.length > 0 ? allMeasurements : measurements;
  
  // Client-side mounting detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Container size detection for responsive chart
  useLayoutEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    // Initial size
    updateSize();

    // Create ResizeObserver for container changes
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Listen for window resize
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Process voltage data for polar chart
  const polarData = useMemo(() => {
    console.log('🔍🔍🔍 Angular Apache - PROCESSANDO DADOS POLARES!');
    console.log('🔍 Angular Apache - pmuData:', pmuData);
    console.log('🔍 Angular Apache - pmuData length:', pmuData?.length || 0);
    
    if (!pmuData || pmuData.length === 0) {
      console.log('🔍 Angular Apache - No pmuData available');
      return [];
    }
    
    console.log('🔍 Angular Apache - Processing voltage data for', pmuData.length, 'PMUs');
    console.log('🔍 Angular Apache - First PMU sample:', pmuData[0]);
    
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
    
    console.log(`📊📊📊 Angular Apache - Found ${validPMUs.length} PMUs with valid voltage data`);
    
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
    
    console.log('📊📊📊 Angular Apache - Final polarData result:', result);
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
    const index = polarData.findIndex(data => data.pmuId === pmuId);
    return PMU_COLORS[index % PMU_COLORS.length];
  }, [polarData]);

  // Configuração do gráfico ECharts
  const chartOption = useMemo(() => {
    if (!polarData.length || !selectedPMUs.length) {
      return null;
    }

    const filteredData = polarData.filter(data => selectedPMUs.includes(data.pmuId));
    
    return {
      title: {
        text: 'Fasores de Tensão',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      polar: {
        radius: ['10%', '80%']
      },
      angleAxis: {
        type: 'value',
        startAngle: 90,
        min: 0,
        max: 360,
        clockwise: false,
        axisLabel: {
          formatter: '{value}°'
        }
      },
      radiusAxis: {
        type: 'value',
        min: 0,
        axisLabel: {
          formatter: '{value} pu'
        }
      },
      series: [{
        type: 'scatter',
        coordinateSystem: 'polar',
        data: filteredData.map(data => ({
          value: [data.theta, data.r],
          name: data.name,
          itemStyle: {
            color: getPMUColor(data.pmuId)
          }
        })),
        symbolSize: 8
      }],
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = filteredData[params.dataIndex];
          return `
            <strong>${data.name}</strong><br/>
            Magnitude: ${data.magnitude.toFixed(2)} kV (${data.r.toFixed(3)} pu)<br/>
            Ângulo: ${data.angle.toFixed(1)}°<br/>
            Estação: ${data.station}<br/>
            Estado: ${data.state}
          `;
        }
      },
      legend: {
        show: true,
        bottom: 10,
        data: filteredData.map(data => ({
          name: data.name,
          icon: 'circle',
          textStyle: {
            color: getPMUColor(data.pmuId)
          }
        }))
      }
    };
  }, [polarData, selectedPMUs, getPMUColor]);
  
  // LOGS APÓS OS HOOKS
  console.log('🎯🎯🎯 ANGULAR APACHE - COMPONENTE INICIADO! 🎯🎯🎯');
  console.log('🎯🎯🎯 ANGULAR APACHE - TIMESTAMP:', new Date().toISOString());
  console.log('🎯🎯🎯 ANGULAR APACHE - systemData:', systemData);
  
  console.log('🔥🔥🔥 ANGULAR CHART - Hook usePMUData result:');
  console.log('🔥🔥🔥 ANGULAR CHART - measurements:', measurements?.length || 0);
  console.log('🔥🔥🔥 ANGULAR CHART - allMeasurements:', allMeasurements?.length || 0);
  console.log('🔥🔥🔥 ANGULAR CHART - isRealDataConnected:', isRealDataConnected);
  
  console.log('🔥🔥🔥 ANGULAR CHART - pmuData after hook:', pmuData?.length || 0);
  
  // Early return moved after all hooks to prevent hook order issues
  const shouldShowEmptyState = !pmuData || pmuData.length === 0;
  
  if (shouldShowEmptyState) {
    console.log('🔍 Angular Apache - Sem dados reais do webservice, aguardando conexão...');
  }
  
  console.log('🔍 Angular Apache - pmuData final disponível:', pmuData?.length || 0, 'PMUs');
  
  console.log('🔍 Angular Apache - Component rendered');
  console.log('🔍 Angular Apache - measurements:', measurements?.length || 0);
  console.log('🔍 Angular Apache - allMeasurements:', allMeasurements?.length || 0);
  console.log('🔍 Angular Apache - pmuData:', pmuData?.length || 0);
  console.log('🔍 Angular Apache - isRealDataConnected:', isRealDataConnected);
  console.log('🔍 Angular Apache - isClient:', isClient);
  
  // Hooks já declarados no início do componente

  // Debug: verificar estado completo
  console.log('🔍 Angular Apache - Debug completo:');
  console.log('🔍 Angular Apache - isRealDataConnected:', isRealDataConnected);
  console.log('🔍 Angular Apache - measurements length:', measurements?.length || 0);
  console.log('🔍 Angular Apache - allMeasurements length:', allMeasurements?.length || 0);
  console.log('🔍 Angular Apache - pmuData length:', pmuData?.length || 0);
  
  // Temporariamente comentar a verificação de isRealDataConnected para debug
  if (false && !isRealDataConnected) {
    console.log('🔍 Angular Apache - Showing disconnected state because isRealDataConnected is false');
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
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

  // Hooks duplicados removidos - já declarados no início do componente



  // getPMUColor já declarado no início do componente

  // Configuração do gráfico ECharts otimizada com useMemo
  const echartsOption = useMemo(() => {
    console.log('🔍 Angular Apache - echartsOption useMemo triggered');
    console.log('🔍 Angular Apache - polarData length:', polarData.length);
    console.log('🔍 Angular Apache - selectedPMUs:', selectedPMUs);
    console.log('🔍 Angular Apache - relativeAngles:', relativeAngles);
    
    if (!polarData.length || selectedPMUs.length === 0) {
      console.log('🔍 Angular Apache - No polar data, returning empty option');
      return {
        polar: {
          radius: '80%'
        },
        angleAxis: {
          type: 'value',
          startAngle: 180, // 0° fica onde estava o -180° (lado direito)
          clockwise: false, // sentido anti-horário para fasores
          min: -180,
          max: 180,
          interval: 30
        },
        radiusAxis: {
          type: 'value',
          min: 0,
          max: 1.5, // Aumentado para acomodar valores PU > 1
          axisLabel: {
            show: true,
            formatter: '{value} pu'
          }
        },
        series: []
      };
    }
    
    const selectedData = polarData.filter(data => selectedPMUs.includes(data.pmuId));
    console.log('🔍 Angular Apache - Selected data length:', selectedData.length);
    
    if (selectedData.length === 0) {
      console.log('🔍 Angular Apache - No selected data, returning empty series');
      return {
        polar: {
          radius: '80%'
        },
        angleAxis: {
          type: 'value',
          startAngle: 180, // 0° fica onde estava o -180° (lado direito)
          clockwise: false, // sentido anti-horário para fasores
          min: -180,
          max: 180,
          interval: 30
        },
        radiusAxis: {
          type: 'value',
          min: 0,
          max: 1
        },
        series: []
      };
    }
    
    // Criar séries para fasores - PMU de referência no ângulo 0° e outras com ângulos relativos
    const series: any[] = [];
    
    selectedData.forEach(data => {
      const isReference = data.pmuId === referencePMU;
      const relativeAngle = isReference ? 0 : (relativeAngles[data.pmuId] || 0);
      const color = getPMUColor(data.pmuId);
      
      // Série de linha para o fasor (vetor do centro até a ponta)
      series.push({
        type: 'line',
        coordinateSystem: 'polar',
        name: `${data.name}_fasor`,
        data: [
          [relativeAngle, 0],    // Início no centro
          [relativeAngle, data.r] // Fim na magnitude
        ],
        lineStyle: {
          color: color,
          width: isReference ? 3 : 2,
          type: 'solid'
        },
        symbol: ['none', 'arrow'], // Seta apenas no final
        symbolSize: [0, isReference ? 20 : 16],
        symbolRotate: [0, relativeAngle + 90], // Rotação da seta
        itemStyle: {
          color: color,
          borderColor: color,
          borderWidth: 2
        },
        silent: true,
        tooltip: {
          show: false
        },
        z: isReference ? 10 : 5
      });
      
      // Série de scatter para o ponto final do fasor (círculo na ponta)
      series.push({
        type: 'scatter',
        coordinateSystem: 'polar',
        name: data.name,
        data: [[relativeAngle, data.r]],
        symbol: 'circle',
        symbolSize: isReference ? 12 : 8, // Círculo menor na ponta
        itemStyle: {
          color: color,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: isReference ? 6 : 3,
          shadowColor: color
        },
        tooltip: {
          formatter: function() {
            const refText = isReference ? ' (REFERÊNCIA)' : '';
            return `<b>${data.name}${refText}</b><br/>` +
                   `Magnitude: ${data.magnitude.toFixed(3)} kV<br/>` +
                   `Magnitude PU: ${data.r.toFixed(3)} pu<br/>` +
                   `Ângulo Original: ${data.angle.toFixed(2)}°<br/>` +
                   `Ângulo Relativo: ${relativeAngle.toFixed(2)}°`;
          }
        },
        z: isReference ? 12 : 7 // Acima da linha
      });
      
      // Adicionar um ponto no centro para mostrar origem dos fasores
      if (isReference) {
        series.push({
          type: 'scatter',
          coordinateSystem: 'polar',
          name: 'origem',
          data: [[0, 0]],
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#333',
            borderColor: '#fff',
            borderWidth: 2
          },
          tooltip: {
            formatter: 'Origem dos Fasores (0,0)'
          },
          z: 15,
          silent: false
        });
      }
    });
    
    console.log('🔍 Angular Apache - Generated series:', series.length);
    console.log('🔍 Angular Apache - Series data:', series.map(s => ({
      name: s.name,
      data: s.data,
      type: s.type,
      coordinateSystem: s.coordinateSystem
    })));
    console.log('🔍 Angular Apache - Selected data for series:', selectedData.map(d => ({
      pmuId: d.pmuId,
      name: d.name,
      magnitudePU: d.r,
      relativeAngle: relativeAngles[d.pmuId]
    })));
    
    // Adicionar série para mostrar os valores de magnitude na horizontal (0 graus)
    const magnitudeLabels = {
      type: 'scatter',
      coordinateSystem: 'polar',
      data: [
        [0, 0.2], [0, 0.4], [0, 0.6], [0, 0.8], [0, 1.0], [0, 1.2], [0, 1.4]
      ],
      symbol: 'none',
      label: {
        show: true,
        position: 'right',
        formatter: function(params: any) {
          return params.data[1].toFixed(1) + ' pu';
        },
        fontSize: 10,
        color: '#666',
        offset: [5, 0]
      },
      tooltip: {
        show: false
      },
      silent: true
    };
    
    console.log('🔍 Angular Apache - Fasores configurados como vetores com setas');
    console.log('🔍 Angular Apache - PMU de referência:', referencePMU, 'no ângulo 0°');
    
    return {
        title: {
          text: 'Fasores de Tensão - Diagrama Polar',
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 14,
            color: '#1f2937',
            fontFamily: 'Inter, system-ui, sans-serif'
          }
        },
        tooltip: {
           trigger: 'item',
           backgroundColor: 'rgba(50, 50, 50, 0.9)',
           borderColor: '#777',
           borderWidth: 1,
           textStyle: {
             color: '#fff'
           }
         },
       polar: {
         radius: '75%',
         center: ['50%', '55%']
       },
      angleAxis: {
        type: 'value',
        startAngle: 180, // 0° no lado direito
        clockwise: false, // sentido anti-horário para fasores
        min: -180,
        max: 180,
        interval: 30,
        axisLabel: {
          formatter: '{value}°',
          fontSize: 11,
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#eee',
            type: 'dashed'
          }
        }
      },
      radiusAxis: {
        type: 'value',
        min: 0,
        max: 1.5, // Aumentado para acomodar valores PU > 1
        axisLabel: {
          show: true,
          formatter: '{value} pu',
          fontSize: 10,
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: [...series, magnitudeLabels]
    };
  }, [polarData, selectedPMUs, relativeAngles, getPMUColor, referencePMU]);

  // Configuração do ECharts
  const echartsConfig = {
    renderer: 'canvas' as const,
    locale: 'pt'
  };

  // Show loading state only when client is not ready
  if (!isClient) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-full animate-pulse"></div>
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

  // Filter selected data
  const selectedData = polarData.filter(data => selectedPMUs.includes(data.pmuId));
  
  console.log('🔍 Angular Debug - polarData.length:', polarData.length);
  console.log('🔍 Angular Debug - selectedPMUs:', selectedPMUs);
  console.log('🔍 Angular Debug - selectedData.length:', selectedData.length);
  console.log('🔍 Angular Debug - measurements?.length:', measurements?.length);

  // Show waiting message when no data available or no PMUs selected
  if (shouldShowEmptyState || selectedData.length === 0) {
    const pmuCount = measurements?.length || 0;
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Fasores de Tensão
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Gráfico Polar
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
            {shouldShowEmptyState ? (
              <>
                <p className="text-gray-600 text-sm mb-1">🔌 Aguardando dados do webservice</p>
                <p className="text-gray-500 text-xs">
                  Conectando ao servidor de dados reais...
                </p>
              </>
            ) : pmuCount === 0 ? (
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
            <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full animate-pulse"></div>
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
          <p className="text-xs text-gray-500">
            Com tensão: {polarData.length}
          </p>

        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-3 w-full sm:w-96 border border-gray-200 shadow-inner">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Selecionar PMUs para Visualização
          </h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin">
            {(polarData || []).map((pmu) => {
              const isSelected = selectedPMUs.includes(pmu.pmuId);
              const color = getPMUColor(pmu.pmuId);
              
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
                    <span>{pmu.name || `PMU ${pmu.pmuId}`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seletor de PMU de referência - embaixo das PMUs selecionadas */}
      <div className="mb-1 sm:mb-2 flex-shrink-0">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-3 max-w-md border border-gray-200 shadow-inner">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">PMU Referência:</label>
            <select
              value={referencePMU}
              onChange={(e) => setReferencePMU(e.target.value)}
              className="bg-white text-gray-900 px-2 py-1.5 rounded-lg text-sm border border-gray-300 focus:border-orange-500 focus:outline-none shadow-sm flex-1 min-w-0"
            >
              {(polarData || []).filter(pmu => selectedPMUs.includes(pmu.pmuId)).map(pmu => (
                <option key={pmu.pmuId} value={pmu.pmuId}>
                  {pmu.name || `PMU ${pmu.pmuId}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Área do gráfico */}
      <div ref={plotContainerRef} className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-4 border border-gray-200 shadow-inner overflow-hidden">
        <div className="w-full h-full">
          <ReactECharts
            option={echartsOption}
            style={{ width: '100%', height: '100%' }}
            opts={echartsConfig}
            key={revision}
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
            <span>Referência: <span className="text-orange-600 font-medium">{polarData.find(p => p.pmuId === referencePMU)?.name || referencePMU}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

AngularDifferenceChartComponent.displayName = 'AngularDifferenceChartComponent';

export default AngularDifferenceChartComponent;