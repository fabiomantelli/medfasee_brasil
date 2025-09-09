'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import { PMUMeasurement } from '../services/pmuService';

/**
 * Hook moderno 2025 para inicialização do dashboard
 * Simplificado e otimizado para performance
 */
export const useDashboardInitialization = () => {
  const [isClient, setIsClient] = useState(false);
  const pmuService = useDashboardStore(state => state.pmuService);
  const isRealDataConnected = useDashboardStore(state => state.isRealDataConnected);
  
  // Client-side mounting detection - apenas uma vez
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Memoized states para evitar re-renders desnecessários
  const isInitialized = useMemo(() => 
    isClient && !!pmuService && isRealDataConnected,
    [isClient, pmuService, isRealDataConnected]
  );
  
  const isLoading = useMemo(() => 
    isClient && !pmuService,
    [isClient, pmuService]
  );
  
  return { isInitialized, isLoading, isClient };
};

/**
 * Hook otimizado para dados PMU com seletores Zustand
 * Evita re-renders desnecessários usando seletores específicos
 */
export const usePMUData = () => {
  // Seletores otimizados - apenas re-renderiza quando dados específicos mudam
  const pmuMeasurements = useDashboardStore(state => state.pmuMeasurements);
  const regionData = useDashboardStore(state => state.regionData);
  const stats = useDashboardStore(state => state.stats);
  const isRealDataConnected = useDashboardStore(state => state.isRealDataConnected);
  
  // Memoização otimizada para medições válidas
  const validMeasurements = useMemo(() => 
    pmuMeasurements.filter(m => m.frequency !== null && m.status === 'active'),
    [pmuMeasurements]
  );
  
  return {
    measurements: validMeasurements,
    allMeasurements: pmuMeasurements,
    regionData,
    stats,
    isRealDataConnected
  };
};

/**
 * Hook simplificado para seleção de PMU
 * Usa Zustand store diretamente para estado global
 */
export const usePMUSelection = () => {
  const selectedPMUs = useDashboardStore(state => state.selectedPMUs);
  const setSelectedPMUs = useDashboardStore(state => state.setSelectedPMUs);
  const pmuMeasurements = useDashboardStore(state => state.pmuMeasurements);
  
  const [selectedPMU, setSelectedPMU] = useState<PMUMeasurement | null>(null);
  
  const selectPMU = useMemo(() => (pmuId: string) => {
    const pmu = pmuMeasurements.find(p => p.pmuId === pmuId);
    setSelectedPMU(pmu);
  }, [pmuMeasurements]);
  
  return {
    selectedPMUs,
    setSelectedPMUs,
    selectedPMU,
    selectPMU
  };
};

/**
 * Hook minimalista para estado de loading
 * Removido estado desnecessário de layouts
 */
export const useLoadingState = () => {
  const pmuService = useDashboardStore(state => state.pmuService);
  const isRealDataConnected = useDashboardStore(state => state.isRealDataConnected);
  
  const isLoading = useMemo(() => 
    !pmuService || !isRealDataConnected,
    [pmuService, isRealDataConnected]
  );
  
  return { isLoading };
};