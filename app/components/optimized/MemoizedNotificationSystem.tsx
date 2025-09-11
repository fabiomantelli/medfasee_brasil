'use client';

import React from 'react';
import { usePMUData } from '../../hooks/useDashboard';

interface SystemData {
  frequency: number;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical' | 'disconnected';
  regions: {
    [key: string]: {
      frequency: number;
      status: 'normal' | 'warning' | 'critical' | 'disconnected';
    };
  };
}

interface MemoizedNotificationSystemProps {
  systemData: SystemData;
}

/**
 * Sistema de notificações otimizado - sem React.memo para dados que mudam constantemente
 */
const MemoizedNotificationSystem = ({ systemData }: MemoizedNotificationSystemProps) => {
  const { stats, isRealDataConnected } = usePMUData();
  
  // Memoized notifications
  const notifications = React.useMemo(() => {
    const alerts = [];
    
    // Status do sistema (só mostrar se há conexão real)
    if (isRealDataConnected) {
      if (systemData.status === 'critical') {
        alerts.push({
          id: 'system-critical',
          type: 'error' as const,
          title: 'Sistema Crítico',
          message: `Frequência fora dos limites seguros: ${systemData.frequency.toFixed(3)} Hz`,
          timestamp: new Date(systemData.timestamp)
        });
      } else if (systemData.status === 'warning') {
        alerts.push({
          id: 'system-warning',
          type: 'warning' as const,
          title: 'Atenção no Sistema',
          message: `Frequência em estado de alerta: ${systemData.frequency.toFixed(3)} Hz`,
          timestamp: new Date(systemData.timestamp)
        });
      }
    }
    
    // Status da conexão
    if (!isRealDataConnected) {
      alerts.push({
        id: 'connection-disconnected',
        type: 'error' as const,
        title: 'Webservice Indisponível',
        message: 'Não é possível exibir notificações sem conexão real',
        timestamp: new Date(systemData.timestamp)
      });
    }
    
    // PMUs inativas (só mostrar se há conexão real)
    if (isRealDataConnected) {
      const inactivePMUs = stats.totalPMUs - stats.activePMUs;
      if (inactivePMUs > 0) {
        alerts.push({
          id: 'pmus-inactive',
          type: 'warning' as const,
          title: 'PMUs Inativas',
          message: `${inactivePMUs} PMUs sem dados válidos`,
          timestamp: new Date(systemData.timestamp)
        });
      }
    }
    
    // Regiões com problemas (só mostrar se há conexão real)
    if (isRealDataConnected) {
      Object.entries(systemData.regions).forEach(([region, data]) => {
        if (data.status === 'critical') {
          alerts.push({
            id: `region-${region}`,
            type: 'error' as const,
            title: `Região ${region.charAt(0).toUpperCase() + region.slice(1)}`,
            message: `Frequência crítica: ${data.frequency.toFixed(3)} Hz`,
            timestamp: new Date(systemData.timestamp)
          });
        }
      });
    }
    
    return alerts.slice(0, 5); // Limitar a 5 notificações
  }, [systemData, isRealDataConnected, stats]);
  
  const getNotificationIcon = React.useCallback((type: 'error' | 'warning' | 'info' | 'success') => {
    switch (type) {
      case 'error':
        return (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
      case 'info':
        return (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
    }
  }, []);
  
  if (!notifications || notifications.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
        {/* Cabeçalho do painel */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-full animate-pulse"></div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Sistema de Notificações
            </h3>
          </div>
        </div>
        
        {/* Área de conteúdo */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-4 border border-gray-200 shadow-inner overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-600">Sistema operando normalmente</p>
            <p className="text-sm text-gray-500 mt-1">Nenhum alerta ativo</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 sm:p-4 pb-4 sm:pb-6 flex flex-col" style={{height: 'calc(100% - 4rem)'}}>
      {/* Cabeçalho do painel */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-full animate-pulse"></div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            Sistema de Notificações
          </h3>
        </div>
        <div className="text-xs text-gray-500">
          {notifications?.length || 0} alerta{(notifications?.length || 0) !== 1 ? 's' : ''} ativo{(notifications?.length || 0) !== 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Área de conteúdo */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 sm:p-4 border border-gray-200 shadow-inner overflow-hidden">
        <div className="divide-y divide-gray-200 h-full overflow-y-auto">
          {(notifications || []).map((notification) => (
            <div key={notification.id} className="p-4">
              <div className="flex items-start space-x-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

MemoizedNotificationSystem.displayName = 'MemoizedNotificationSystem';

export default MemoizedNotificationSystem;