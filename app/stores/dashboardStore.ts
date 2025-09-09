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
  setPmuMeasurements: (measurements: PMUMeasurement[]) => void;
  setRegionData: (data: RegionData[]) => void;
  setSelectedPMUs: (pmus: Set<string>) => void;
  setError: (error: string | null) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
  updateLastUpdate: () => void;
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
    immer((set, get) => ({
      // Estado inicial otimizado
      pmuService: null,
      isRealDataConnected: false,
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
      }),
      
      setPmuMeasurements: (measurements) => set((state) => {
        state.pmuMeasurements = measurements;
        
        // Atualiza stats automaticamente
        const activePMUs = measurements.filter(m => m.status === 'active').length;
        const avgFreq = measurements.length > 0 
          ? measurements.reduce((sum, m) => sum + (m.frequency || 0), 0) / measurements.length 
          : 0;
        
        // Usar timestamp das PMUs do webservice se disponível
        let lastUpdateTime = 'Nunca';
        if (measurements.length > 0) {
          // Pegar o timestamp mais recente das PMUs
          const latestTimestamp = measurements
            .map(m => m.timestamp)
            .filter(t => t && t !== '2024-01-01T00:00:00.000Z')
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
          
          if (latestTimestamp) {
            lastUpdateTime = new Date(latestTimestamp).toLocaleTimeString('pt-BR');
          }
        }
        
        state.stats = {
          totalPMUs: 28, // Total de PMUs definidas no XML
          activePMUs,
          averageFrequency: Number(avgFreq.toFixed(3)),
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
      }),
      
      updateLastUpdate: () => set((state) => {
        state.lastUpdate = new Date().toLocaleTimeString('pt-BR');
      })
    }))
  ),
  { name: 'dashboard-store' }
));