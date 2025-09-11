'use client';

import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';

function PMUInitializerCore() {
  console.log('🚀 PMUInitializer - Componente inicializado');
  const { pmuService, setPmuService, setIsRealDataConnected, setPmuMeasurements } = useDashboardStore();
  const [initialized, setInitialized] = useState(false);
  
  console.log('🚀 PMUInitializer - pmuService exists:', !!pmuService, 'initialized:', initialized);
  
  // INICIALIZAÇÃO IMEDIATA - EXECUTAR NO CORPO DO COMPONENTE
  React.useMemo(() => {
    if (!pmuService && !initialized) {
      console.log('🚀🚀🚀 PMUInitializer - EXECUTANDO INICIALIZAÇÃO IMEDIATA!');
      setInitialized(true);
      
      // Executar inicialização assíncrona
      (async () => {
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
          const service = PMUService.getInstance(config, pmus);
          
          console.log('🚀 PMUInitializer - Configurando subscription...');
          service.subscribe((measurements) => {
            console.log('📊 PMUInitializer - Dados recebidos:', measurements.length, 'PMUs');
            setPmuMeasurements(measurements);
          });
          
          // Subscribe to connection status updates
          service.subscribeToConnectionStatus((connected) => {
            console.log('🔌 PMUInitializer - Status de conexão atualizado:', connected);
            setIsRealDataConnected(connected);
          });
          
          setPmuService(service);
          // Não forçar true aqui - deixar o callback controlar o status
          
          console.log('🚀 PMUInitializer - Iniciando polling...');
          service.start();
          
          console.log('⚡ PMUInitializer - Forçando primeira atualização...');
          await service.forceUpdate();
          
          console.log('✅ PMUInitializer - Inicialização concluída!');
          
        } catch (error) {
          console.error('❌ PMUInitializer - Erro na inicialização:', error);
          setIsRealDataConnected(false);
        }
      })();
    }
  }, [pmuService, initialized]);
  
  // FALLBACK useEffect
  useEffect(() => {
    console.log('🚀🚀🚀 PMUInitializer - useEffect EXECUTADO!');
    console.log('🚀 PMUInitializer - pmuService exists:', !!pmuService);
    
    if (pmuService) {
      console.log('🚀 PMUInitializer - PMU Service já existe, pulando inicialização');
      return;
    }
    
    if (initialized) {
      console.log('🚀 PMUInitializer - Já inicializado, pulando useEffect');
      return;
    }
    
    console.log('🚀 PMUInitializer - Iniciando inicialização do PMU Service via useEffect...');
    setInitialized(true);
    
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
        const service = PMUService.getInstance(config, pmus);
        
        console.log('🚀 PMUInitializer - Configurando subscription...');
        service.subscribe((measurements) => {
          console.log('📊 PMUInitializer - Dados recebidos:', measurements.length, 'PMUs');
          setPmuMeasurements(measurements);
        });
        
        // Subscribe to connection status updates
        service.subscribeToConnectionStatus((connected) => {
          console.log('🔌 PMUInitializer - Status de conexão atualizado:', connected);
          setIsRealDataConnected(connected);
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
  }, []);

  // Log do estado atual
  console.log('🚀 PMUInitializer - Component renderizado no cliente (Next.js 15 App Router)');
  
  return null; // This component doesn't render anything
}

export default function PMUInitializer() {
  console.log('🚀 PMUInitializer - Wrapper component called');
  return <PMUInitializerCore />;
}