'use client';

import React, { useState, useEffect } from 'react';
import RealBrazilMap from './components/RealBrazilMap';
import Dashboard from './components/Dashboard';
import FrequencyChart from './components/FrequencyChart';
import NotificationSystem from './components/NotificationSystem';
import Header from './components/Header';
import { PMUService } from './services/pmuService';
import { loadPMUData } from './utils/xmlParser';

export default function Home() {
  const [systemData, setSystemData] = useState({
    frequency: 60.0,
    timestamp: new Date().toISOString(),
    status: 'normal' as const,
    regions: {
      north: { frequency: 60.0, status: 'normal' as const },
      northeast: { frequency: 59.98, status: 'normal' as const },
      southeast: { frequency: 60.02, status: 'normal' as const },
      south: { frequency: 59.99, status: 'normal' as const },
      centerwest: { frequency: 60.01, status: 'normal' as const }
    }
  });

  const [pmuService, setPmuService] = useState<PMUService | null>(null);
  const [pmuMeasurements, setPmuMeasurements] = useState<any[]>([]);
  const [isRealDataConnected, setIsRealDataConnected] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Inicializar serviço PMU
  useEffect(() => {
    setMounted(true);
    
    const initializePMUService = async () => {
      try {
        const { config, pmus } = await loadPMUData();
        const service = new PMUService(config, pmus);
        setPmuService(service);
        setIsRealDataConnected(true);
      } catch (error) {
        console.warn('Failed to initialize PMU service, using simulated data:', error);
        setIsRealDataConnected(false);
      }
    };

    initializePMUService();
  }, []);

  // Atualizar dados das PMUs periodicamente
  useEffect(() => {
    if (!pmuService || !isRealDataConnected) return;

    const updateData = async () => {
      try {
        const regionData = await pmuService.getRegionAggregatedData();
        const allPmuData = await pmuService.getAllPMUMeasurements();
        
        updateSystemDataFromPMU(regionData);
        setPmuMeasurements(allPmuData);
      } catch (error) {
        console.error('Error updating PMU data:', error);
      }
    };

    // Carregar dados iniciais
    updateData();

    const interval = setInterval(updateData, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [pmuService, isRealDataConnected]);

  // Função para atualizar dados do sistema com dados das PMUs
  const updateSystemDataFromPMU = (regionData: any) => {
    const allFrequencies = Object.values(regionData).map((region: any) => region.frequency);
    const avgFrequency = allFrequencies.reduce((sum: number, freq: number) => sum + freq, 0) / allFrequencies.length;
    
    let overallStatus: 'normal' | 'warning' | 'critical' = 'normal';
    if (Math.abs(avgFrequency - 60) > 0.5) overallStatus = 'critical';
    else if (Math.abs(avgFrequency - 60) > 0.2) overallStatus = 'warning';

    setSystemData({
      frequency: avgFrequency,
      timestamp: new Date().toISOString(),
      status: overallStatus,
      regions: regionData
    });
  };

  // Fallback para dados simulados
  const startSimulatedData = () => {
    const interval = setInterval(() => {
      setSystemData(prev => ({
        ...prev,
        frequency: 59.95 + Math.random() * 0.1,
        timestamp: new Date().toISOString(),
        regions: {
          north: { frequency: 59.95 + Math.random() * 0.1, status: 'normal' as const },
          northeast: { frequency: 59.95 + Math.random() * 0.1, status: 'normal' as const },
          southeast: { frequency: 59.95 + Math.random() * 0.1, status: 'normal' as const },
          south: { frequency: 59.95 + Math.random() * 0.1, status: 'normal' as const },
          centerwest: { frequency: 59.95 + Math.random() * 0.1, status: 'normal' as const }
        }
      }));
    }, 2000);

    return () => clearInterval(interval);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {isRealDataConnected ? (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                Conectado aos dados reais das PMUs das Universidades Brasileiras
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                Usando dados simulados - Webservice externo não acessível (restrições CORS)
              </p>
            </div>
          </div>
        </div>
      )}
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Projeto Medfasee
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Monitoramento do Sistema Elétrico Brasileiro em Tempo Real
          </p>
        </div>

        {/* Dashboard integrado com todos os componentes */}
        <Dashboard 
          systemData={systemData} 
          pmuMeasurements={pmuMeasurements}
          mapComponent={<RealBrazilMap data={systemData} />}
          chartComponent={<FrequencyChart pmuMeasurements={pmuMeasurements} />}
        />

        {/* Status geral do sistema */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status do Sistema
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Última atualização: {mounted ? new Date(systemData.timestamp).toLocaleString('pt-BR') : '--/--/---- --:--:--'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 dark:text-green-400 font-medium">
                Sistema Interligado Nacional
              </span>
            </div>
          </div>
        </div>
      </main>
      
      {/* Sistema de notificações */}
      <NotificationSystem systemData={systemData} />
    </div>
  );
}
