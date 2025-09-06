'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

interface NotificationSystemProps {
  systemData: {
    frequency: number;
    regions: {
      [key: string]: {
        frequency: number;
        status: string;
      };
    };
  };
}

export default function NotificationSystem({ systemData }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Gerar notificações baseadas nos dados do sistema
  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Verificar frequência geral
    if (systemData.frequency < 59.9 || systemData.frequency > 60.1) {
      newNotifications.push({
        id: `freq-critical-${Date.now()}`,
        type: 'error',
        title: 'Frequência Crítica',
        message: `Frequência do sistema fora dos limites seguros: ${systemData.frequency.toFixed(3)} Hz`,
        timestamp: new Date(),
        dismissed: false
      });
    } else if (systemData.frequency < 59.95 || systemData.frequency > 60.05) {
      newNotifications.push({
        id: `freq-warning-${Date.now()}`,
        type: 'warning',
        title: 'Atenção na Frequência',
        message: `Frequência próxima aos limites: ${systemData.frequency.toFixed(3)} Hz`,
        timestamp: new Date(),
        dismissed: false
      });
    }

    // Verificar regiões
    Object.entries(systemData.regions).forEach(([region, data]) => {
      if (data.frequency < 59.9 || data.frequency > 60.1) {
        newNotifications.push({
          id: `region-${region}-${Date.now()}`,
          type: 'error',
          title: `Alerta - Região ${region}`,
          message: `Frequência crítica na região: ${data.frequency.toFixed(3)} Hz`,
          timestamp: new Date(),
          dismissed: false
        });
      }
    });

    // Adicionar apenas notificações novas (evitar duplicatas)
    if (newNotifications.length > 0) {
      setNotifications(prev => {
        const existingIds = prev.map(n => n.id);
        const uniqueNew = newNotifications.filter(n => !existingIds.includes(n.id));
        return [...prev, ...uniqueNew].slice(-10); // Manter apenas as 10 mais recentes
      });
    }
  }, [systemData]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, dismissed: true })));
  };

  const activeNotifications = notifications.filter(n => !n.dismissed);
  const hasActiveNotifications = activeNotifications.length > 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Botão de notificações */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className={`relative p-3 rounded-full shadow-lg transition-colors ${
          hasActiveNotifications 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5" />
        </svg>
        {hasActiveNotifications && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeNotifications.length}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {showNotifications && (
        <div className="absolute top-16 right-0 w-96 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações
              </h3>
              {hasActiveNotifications && (
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Limpar todas
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {activeNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Nenhuma notificação ativa
              </div>
            ) : (
              activeNotifications.map((notification) => (
                <div key={notification.id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {notification.timestamp.toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}