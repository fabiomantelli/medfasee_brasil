'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';

export default function PMUInitializer() {
  console.log('🚀 PMUInitializer - Component function called');
  const { pmuService, setPmuService, setIsRealDataConnected, setPmuMeasurements, updateLastUpdate } = useDashboardStore();
  const [isClient, setIsClient] = useState(false);
  
  console.log('🚀 PMUInitializer - Store accessed, pmuService exists:', !!pmuService);
  console.log('🚀 PMUInitializer - Current isClient state:', isClient);
  
  // Inicialização simplificada
  useEffect(() => {
    console.log('⚡ PMUInitializer - useEffect EXECUTADO!');
    setIsClient(true);
    
    if (!pmuService) {
      console.log('⚡ PMUInitializer - Iniciando serviço PMU...');
      
      const initializePMUService = async () => {
        try {
          console.log('🚀 PMUInitializer - Carregando módulos...');
          const [{ loadPMUData }, { PMUService }] = await Promise.all([
            import('../utils/xmlParser'),
            import('../services/pmuService')
          ]);
          
          console.log('🚀 PMUInitializer - Carregando dados XML...');
          const { pmus, config } = await loadPMUData();
          console.log(`🚀 PMUInitializer - ${pmus?.length || 0} PMUs carregadas!`);
          
          console.log('🚀 PMUInitializer - Criando PMU Service...');
          const service = new PMUService(config, pmus);
          
          console.log('🚀 PMUInitializer - Configurando subscription...');
          service.subscribe((measurements) => {
            console.log('📊 PMUInitializer - Dados recebidos:', measurements.length);
            setPmuMeasurements(measurements);
            updateLastUpdate();
          });
          
          setPmuService(service);
          setIsRealDataConnected(true);
          
          console.log('🚀 PMUInitializer - Iniciando polling...');
          service.start();
          
          console.log('⚡ PMUInitializer - Forçando primeira atualização...');
          await service.forceUpdate();
          
          console.log('✅ PMUInitializer - Inicialização concluída!');
          
        } catch (error) {
          console.error('❌ PMUInitializer - Erro na inicialização:', error);
          setIsRealDataConnected(false);
        }
      };
      
      initializePMUService();
    }
  }, [pmuService, setPmuService, setIsRealDataConnected, setPmuMeasurements, updateLastUpdate]);

  // Log do estado atual
  console.log('🚀 PMUInitializer - Current isClient state:', isClient);
  
  return null; // This component doesn't render anything
}