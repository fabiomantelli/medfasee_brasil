import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PMUService } from '../services/pmuService';
import { PMUMeasurement, RegionData } from '../services/pmuService';

/**
 * Store Zustand otimizado para dashboard PMU
 * Usando immer para imutabilidade e subscribeWithSelector para performance
 */
interface DashboardStats {
  totalPMUs: number;
  activePMUs: number;
  averageFrequency: number;
  lastUpdate: string;
}

interface DashboardState {
  // Core services
  pmuService: PMUService | null;
  isRealDataConnected: boolean;
  isInitializing: boolean;
  
  // Data state
  pmuMeasurements: PMUMeasurement[];
  regionData: RegionData[];
  stats: DashboardStats;
  
  // UI state
  selectedPMUs: Set<string>;
  error: string | null;
  retryCount: number;
  lastUpdate: string;
  
  // Actions - agrupadas por funcionalidade
  setPmuService: (service: PMUService | null) => void;
  setIsRealDataConnected: (connected: boolean) => void;
  setIsInitializing: (initializing: boolean) => void;
  setPmuMeasurements: (measurements: PMUMeasurement[]) => void;
  setRegionData: (data: RegionData[]) => void;
  setSelectedPMUs: (pmus: Set<string>) => void;
  setError: (error: string | null) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
}

// Seletores otimizados para evitar re-renders desnecessários
export const selectPmuMeasurements = (state: DashboardState) => state.pmuMeasurements;
export const selectRegionData = (state: DashboardState) => state.regionData;
export const selectStats = (state: DashboardState) => state.stats;
export const selectSelectedPMUs = (state: DashboardState) => state.selectedPMUs;
export const selectError = (state: DashboardState) => state.error;
export const selectIsRealDataConnected = (state: DashboardState) => state.isRealDataConnected;
export const selectLastUpdate = (state: DashboardState) => state.lastUpdate;
export const selectRetryCount = (state: DashboardState) => state.retryCount;

export const useDashboardStore = create<DashboardState>()(devtools(
  subscribeWithSelector(
    immer((set) => ({
      // Estado inicial otimizado
      pmuService: null,
      isRealDataConnected: false,
      isInitializing: true,
      pmuMeasurements: [],
      regionData: [],
      selectedPMUs: new Set(),
      error: null,
      retryCount: 0,
      lastUpdate: 'Nunca',
      stats: {
        totalPMUs: 0,
        activePMUs: 0,
        averageFrequency: 0,
        lastUpdate: 'Nunca'
      },
      
      // Actions otimizadas com immer
      setPmuService: (service) => set((state) => {
        state.pmuService = service;
      }),
      
      setIsRealDataConnected: (connected) => set((state) => {
        state.isRealDataConnected = connected;
        // Quando definimos o status de conexão, não estamos mais inicializando
        state.isInitializing = false;
      }),
      
      setIsInitializing: (initializing) => set((state) => {
        state.isInitializing = initializing;
      }),
      
      setPmuMeasurements: (measurements) => set((state) => {
        state.pmuMeasurements = measurements;
        
        // Calcular estatísticas
        // Total PMUs = todas as PMUs do XML (não apenas as com dados válidos)
        const totalPMUs = state.pmuService?.getAllPMUs().length || 0;
        const activePMUs = measurements.filter(pmu => pmu.status === 'active').length;
        const validFrequencies = measurements
          .filter(pmu => pmu.status === 'active' && pmu.frequency > 0)
          .map(pmu => pmu.frequency);
        const averageFrequency = validFrequencies.length > 0 
          ? validFrequencies.reduce((sum, freq) => sum + freq, 0) / validFrequencies.length 
          : 0;
        
        // Encontrar o timestamp mais recente das PMUs
        const validTimestamps = measurements
          .map(pmu => pmu.timestamp)
          .filter(timestamp => timestamp && timestamp !== '2024-01-01T00:00:00.000Z');
        
        let lastUpdateTime = 'Nunca';
        if (validTimestamps.length > 0) {
          const latestTimestamp = validTimestamps.reduce((latest, current) => 
            new Date(current) > new Date(latest) ? current : latest
          );
          lastUpdateTime = new Date(latestTimestamp).toLocaleTimeString('pt-BR');
        }
        
        state.stats = {
          totalPMUs,
          activePMUs,
          averageFrequency,
          lastUpdate: lastUpdateTime
        };
        
        state.lastUpdate = lastUpdateTime;
      }),
      
      setRegionData: (data) => set((state) => {
        state.regionData = data;
      }),
      
      setSelectedPMUs: (pmus) => set((state) => {
        state.selectedPMUs = pmus;
      }),
      
      setError: (error) => set((state) => {
        state.error = error;
      }),
      
      incrementRetryCount: () => set((state) => {
        state.retryCount += 1;
      }),
      
      resetRetryCount: () => set((state) => {
        state.retryCount = 0;
      })
    }))
  ),
  { name: 'dashboard-store' }
));