'use client';

import React from 'react';
import { Activity, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatNumber, formatPercentage } from '../../lib/utils';

// Server Component for initial dashboard metrics
// This runs on the server and provides fast initial load

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'good' | 'warning' | 'error';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  status = 'good'
}) => {
  const statusColors = {
    good: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${statusColors[status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? formatNumber(value) : value}
            </p>
          </div>
        </div>
        
        {change !== undefined && (
          <div className={`text-sm font-medium ${trendColors[trend]}`}>
            <TrendingUp className="h-4 w-4 inline mr-1" />
            {change > 0 ? '+' : ''}{formatPercentage(change)}
          </div>
        )}
      </div>
    </div>
  );
};

// Server-side data fetching simulation
// In a real app, this would fetch from your database or API
function getInitialMetrics(timestamp?: string) {
  // Simulate server-side data fetching
  return {
    totalPMUs: 12,
    activeConnections: 8,
    averageFrequency: 60.02,
    systemHealth: 98.5,
    dataPoints: 1247,
    lastUpdate: timestamp || new Date().toISOString()
  };
}

// Main Client Component para evitar problemas de hidratação
export default function DashboardMetrics() {
  const [metrics, setMetrics] = React.useState(() => getInitialMetrics('2024-01-01T00:00:00.000Z'));

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setMetrics(getInitialMetrics());
      
      const interval = setInterval(() => {
        setMetrics(getInitialMetrics());
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="PMUs Conectadas"
        value={`${metrics.activeConnections}/${metrics.totalPMUs}`}
        change={5.2}
        trend="up"
        status="good"
        icon={<Activity className="h-5 w-5 text-blue-600" />}
      />
      
      <MetricCard
        title="Frequência Média"
        value={`${metrics.averageFrequency} Hz`}
        change={0.1}
        trend="up"
        status="good"
        icon={<Zap className="h-5 w-5 text-blue-600" />}
      />
      
      <MetricCard
        title="Saúde do Sistema"
        value={`${metrics.systemHealth}%`}
        change={-0.3}
        trend="down"
        status={metrics.systemHealth > 95 ? 'good' : metrics.systemHealth > 90 ? 'warning' : 'error'}
        icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
      />
      
      <MetricCard
        title="Pontos de Dados"
        value={metrics.dataPoints.toLocaleString('pt-BR')}
        change={12.8}
        trend="up"
        status="good"
        icon={<AlertTriangle className="h-5 w-5 text-blue-600" />}
      />
    </div>
  );
}

// Static metadata for better SEO and performance
export const metadata = {
  title: 'Dashboard Metrics - MedFasee Brasil',
  description: 'Métricas em tempo real do sistema de monitoramento PMU'
};