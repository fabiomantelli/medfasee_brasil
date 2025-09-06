'use client';

import { useEffect, useState } from 'react';
import { PMUMeasurement } from '../services/pmuService';

interface PMUDataPoint {
  timestamp: Date;
  frequency: number;
  pmuId: string;
}

interface FrequencyChartProps {
  pmuMeasurements: PMUMeasurement[];
}

const PMU_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#f43f5e', '#22c55e', '#a855f7', '#0ea5e9',
  '#eab308', '#dc2626', '#059669', '#7c3aed', '#0891b2'
];

export default function FrequencyChart({ pmuMeasurements }: FrequencyChartProps) {
  const [pmuData, setPmuData] = useState<Record<string, PMUDataPoint[]>>({});
  const [selectedPMUs, setSelectedPMUs] = useState<Set<string>>(new Set());

  const maxPoints = 20;

  // Inicializar PMUs selecionadas (primeiras 5 por padrão)
  useEffect(() => {
    if (pmuMeasurements.length > 0 && selectedPMUs.size === 0) {
      const initialPMUs = pmuMeasurements.slice(0, 5).map(pmu => pmu.pmuId);
      setSelectedPMUs(new Set(initialPMUs));
    }
  }, [pmuMeasurements, selectedPMUs.size]);

  useEffect(() => {
    if (pmuMeasurements.length === 0) return;

    setPmuData(prev => {
      const newData = { ...prev };
      
      pmuMeasurements.forEach(pmu => {
        if (!newData[pmu.pmuId]) {
          newData[pmu.pmuId] = [];
        }
        
        // Use the real timestamp from the measurement
        const timestamp = new Date(pmu.timestamp);
        
        newData[pmu.pmuId] = [
          ...newData[pmu.pmuId],
          { timestamp, frequency: pmu.frequency, pmuId: pmu.pmuId }
        ].slice(-maxPoints);
      });
      
      return newData;
    });
  }, [pmuMeasurements]);

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

  const selectedData = Array.from(selectedPMUs)
    .map(pmuId => ({ pmuId, data: pmuData[pmuId] || [] }))
    .filter(item => item.data.length > 0);

  if (selectedData.length === 0 || selectedData.every(item => item.data.length < 2)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Histórico de Frequência das PMUs
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          Coletando dados...
        </div>
      </div>
    );
  }

  // Calcular limites de frequência para todas as PMUs selecionadas
  const allFrequencies = selectedData.flatMap(item => item.data.map(d => d.frequency));
  const minFreq = Math.min(...allFrequencies) - 0.005;
  const maxFreq = Math.max(...allFrequencies) + 0.005;
  const width = 800;
  const height = 400;
  const padding = 60;

  const maxDataLength = Math.max(...selectedData.map(item => item.data.length));
  const getX = (index: number) => padding + (index / (maxDataLength - 1)) * (width - 2 * padding);
  const getY = (frequency: number) => height - padding - ((frequency - minFreq) / (maxFreq - minFreq)) * (height - 2 * padding);

  // Encontrar PMU info para nomes
  const getPMUName = (pmuId: string) => {
    const pmu = pmuMeasurements.find(p => p.pmuId === pmuId);
    return pmu ? `${pmu.station} (${pmu.state})` : pmuId;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <div>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Histórico de Frequência das PMUs
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Monitoramento em tempo real • Últimos {maxPoints} pontos
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedPMUs.size} de {pmuMeasurements.length} PMUs ativas
            </span>
          </div>
        </div>
      </div>
      
      {/* Controles de seleção de PMUs */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 sm:p-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecionar PMUs para Visualização
          </h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {pmuMeasurements.map((pmu, index) => {
              const isSelected = selectedPMUs.has(pmu.pmuId);
              const color = PMU_COLORS[index % PMU_COLORS.length];
              
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
                    <span>{getPMUName(pmu.pmuId)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl p-2 sm:p-4 border border-slate-300 dark:border-slate-600 shadow-inner overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-96 drop-shadow-sm">
          {/* Grid lines and gradients */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#64748b" strokeWidth="0.5" opacity="0.3" />
            </pattern>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.1"/>
              <stop offset="50%" stopColor="#334155" stopOpacity="0.05"/>
              <stop offset="100%" stopColor="#475569" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          <rect width={width} height={height} fill="url(#chartGradient)" rx="12" />
          <rect width={width} height={height} fill="url(#grid)" rx="12" />
          
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
              opacity="0.8"
            />
            <text 
              x={width - padding + 10} 
              y={getY(60) + 4} 
              className="fill-emerald-600 dark:fill-emerald-400 text-sm font-medium"
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
              opacity="0.4"
            />
            <line 
              x1={padding} 
              y1={getY(60.1)} 
              x2={width - padding} 
              y2={getY(60.1)} 
              stroke="#f59e0b" 
              strokeWidth="1" 
              strokeDasharray="4,2" 
              opacity="0.4"
            />
          </g>
          
          {/* PMU lines */}
          {selectedData.map((item, pmuIndex) => {
            const color = PMU_COLORS[pmuMeasurements.findIndex(p => p.pmuId === item.pmuId) % PMU_COLORS.length];
            
            const pathData = item.data.map((point, index) => {
              const x = getX(index);
              const y = getY(point.frequency);
              return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
            }).join(' ');
            
            return (
              <g key={item.pmuId}>
                {/* Glow effect */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                  filter="blur(2px)"
                />
                
                {/* Shadow line for depth */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="rgba(15, 23, 42, 0.4)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                  transform="translate(0, 3)"
                />
                
                {/* Main line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                />
                
                {/* Data points */}
                {item.data.map((point, index) => {
                  const x = getX(index);
                  const y = getY(point.frequency);
                  const isLast = index === item.data.length - 1;
                  
                  return (
                    <g key={`${item.pmuId}-${index}`}>
                      {/* Invisible hover area */}
                      <circle
                        cx={x}
                        cy={y}
                        r="15"
                        fill="transparent"
                        className="cursor-pointer"

                      />
                      {/* Outer glow ring */}
                      <circle
                        cx={x}
                        cy={y}
                        r="10"
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        opacity="0.2"
                        className="animate-pulse"
                      />
                      {/* Middle glow */}
                      <circle
                        cx={x}
                        cy={y}
                        r="7"
                        fill={color}
                        opacity="0.4"
                        filter="blur(1px)"
                      />
                      {/* Point shadow */}
                      <circle
                        cx={x + 1}
                        cy={y + 1}
                        r={isLast ? "5" : "2"}
                        fill="rgba(0,0,0,0.1)"
                      />
                      {/* Main point */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isLast ? "5" : "3"}
                        fill={color}
                        stroke="rgba(255, 255, 255, 0.9)"
                        strokeWidth={isLast ? "2" : "1"}
                        className={isLast ? "animate-pulse" : "hover:scale-125 transition-all duration-200"}
                        className={`${isLast ? "animate-pulse" : "hover:scale-125 transition-all duration-200"} drop-shadow-md`}
                      />
                      {/* Inner core */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isLast ? "2" : "1"}
                        fill="rgba(255, 255, 255, 0.95)"
                        className="drop-shadow-sm"
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
              const range = maxFreq - minFreq;
              const step = range / 4; // 5 markers total
              const markers = [];
              
              for (let i = 0; i <= 4; i++) {
                const freq = minFreq + (step * i);
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
                      className="fill-slate-600 dark:fill-slate-400 text-xs font-medium"
                    >
                      {freq.toFixed(2)}
                    </text>
                  </g>
                );
              });
            })()}
            
            {/* Y-axis title - vertical */}
            <text 
              x="20" 
              y={height / 2} 
              textAnchor="middle" 
              className="fill-slate-700 dark:fill-slate-300 text-sm font-semibold"
              transform={`rotate(-90, 20, ${height / 2})`}
            >
              Frequência (Hz)
            </text>
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
            
            {/* X-axis labels */}
            {Array.from({length: 6}, (_, i) => {
              const pointIndex = Math.floor((maxDataLength - 1) * i / 5);
              const x = getX(pointIndex);
              
              // Get the timestamp from the first available PMU data at this point
              const firstPMUData = selectedData.find(item => item.data[pointIndex]);
              const timestamp = firstPMUData?.data[pointIndex]?.timestamp;
              
              const timeString = timestamp ? 
                `${timestamp.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}.${timestamp.getMilliseconds().toString().padStart(3, '0')}` : '--:--:--.---';
              
              return (
                <g key={i}>
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
                    className="fill-slate-600 dark:fill-slate-400 text-xs font-medium"
                  >
                    {timeString}
                  </text>
                </g>
              );
            })}
            

          </g>
        </svg>
        
        {/* Date display */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Data: {(() => {
                const firstData = selectedData.find(item => item.data.length > 0);
                const firstTimestamp = firstData?.data[0]?.timestamp;
                return firstTimestamp ? firstTimestamp.toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                }) : new Date().toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                });
              })()}
            </span>
          </div>
        </div>

        {/* Modern Legend */}
        <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-emerald-500 border-t-2 border-dashed border-emerald-500"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Referência (60Hz)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Valores Atuais</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-amber-500 opacity-60 border-t border-dashed border-amber-500"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Limites (±0.1Hz)</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Atualização: {new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}