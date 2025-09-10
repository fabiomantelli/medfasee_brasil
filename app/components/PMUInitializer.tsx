'use client';

import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import ClientOnly from './ClientOnly';

function PMUInitializerCore() {
  console.log('🚀🚀🚀 PMUInitializer - EXECUTANDO AGORA - TESTE FORÇADO 2025 🚀🚀🚀');
  const { pmuService, setPmuService, setIsRealDataConnected, setPmuMeasurements, updateLastUpdate, isRealDataConnected } = useDashboardStore();
  const [initialized, setInitialized] = useState(false);
  
  console.log('🚀 PMUInitializer - Store accessed, pmuService exists:', !!pmuService);
  console.log('🚀 PMUInitializer - Initialized state:', initialized);
  
  // INICIALIZAÇÃO DIRETA NO NEXT.JS 15 - SEM DETECÇÃO DE CLIENTE
  // No App Router, componentes 'use client' já executam no lado cliente
  
  // INICIALIZAÇÃO IMEDIATA - FORÇAR EXECUÇÃO
  console.log('🚀🚀🚀 PMUInitializer - EXECUTANDO INICIALIZAÇÃO IMEDIATA!');
  
  if (!initialized && !pmuService) {
    console.log('🚀🚀🚀 PMUInitializer - Condições atendidas, iniciando PMU Service...');
    setInitialized(true);
  }
  
  // INICIALIZAÇÃO DO PMU SERVICE - NEXT.JS 15 APP ROUTER
  useEffect(() => {
    console.log('🚀🚀🚀 PMUInitializer - useEffect EXECUTADO! initialized:', initialized, 'pmuService exists:', !!pmuService);
    console.log('🚀🚀🚀 PMUInitializer - useEffect dependencies changed!');
    
    console.log('⚡ PMUInitializer - EXECUTANDO INICIALIZAÇÃO!');
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
        
        console.log('🚀 PMUInitializer - Obtendo instância singleton do PMU Service...');
        const service = PMUService.getInstance(config, pmus);
        
        console.log('🚀 PMUInitializer - Configurando subscription...');
        service.subscribe((measurements) => {
          console.log('📊 PMUInitializer - CALLBACK EXECUTADO! Dados recebidos:', measurements.length);
          console.log('📊 PMUInitializer - Primeiros 3 PMUs:', measurements.slice(0, 3).map(m => ({ id: m.pmuId, freq: m.frequency, timestamp: m.timestamp })));
          setPmuMeasurements(measurements);
          updateLastUpdate();
          console.log('📊 PMUInitializer - Store atualizado com', measurements.length, 'medições');
        });
        
        setPmuService(service);
        console.log('🚀 PMUInitializer - Definindo isRealDataConnected = true');
        setIsRealDataConnected(true);
        
        // Verificar se foi definido corretamente
        setTimeout(() => {
          const currentState = useDashboardStore.getState();
          console.log('🔍 PMUInitializer - Verificando estado após 1s:');
          console.log('🔍 PMUInitializer - isRealDataConnected:', currentState.isRealDataConnected);
          console.log('🔍 PMUInitializer - pmuMeasurements length:', currentState.pmuMeasurements.length);
        }, 1000);
        
        console.log('🚀 PMUInitializer - Iniciando polling...');
        service.start();
        
        console.log('⚡ PMUInitializer - Forçando primeira atualização...');
        await service.forceUpdate();
        
        console.log('✅ PMUInitializer - Inicialização concluída!');
        console.log('✅ PMUInitializer - isRealDataConnected deveria estar true agora');
        
      } catch (error) {
        console.error('❌ PMUInitializer - Erro na inicialização:', error);
        setIsRealDataConnected(false);
      }
    };
    
    initializePMUService();
  }, [initialized, pmuService, setPmuService, setIsRealDataConnected, setPmuMeasurements, updateLastUpdate]);
  
  // FORÇAR INICIALIZAÇÃO IMEDIATA SE useEffect NÃO EXECUTAR
  React.useLayoutEffect(() => {
    console.log('🚀🚀🚀 PMUInitializer - useLayoutEffect EXECUTADO como fallback!');
    if (!initialized && !pmuService) {
      console.log('🚀🚀🚀 PMUInitializer - FORÇANDO inicialização via useLayoutEffect!');
      setInitialized(true);
    }
  }, [initialized, pmuService]);

  // Log do estado atual
  console.log('🚀 PMUInitializer - Component renderizado no cliente (Next.js 15 App Router)');
  
  return null; // This component doesn't render anything
}

export default function PMUInitializer() {
  console.log('🚀 PMUInitializer - Wrapper component called');
  return <PMUInitializerCore />;
}