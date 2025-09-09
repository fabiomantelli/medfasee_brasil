'use client';

import React from 'react';
import Navigation from './Navigation';
import DashboardMetrics from './DashboardMetrics';
import { SuspenseWrapper } from '../ui/Loading';
import MobileMenu from '../ui/MobileMenu';

// Server Component for optimized dashboard layout
// Provides structure and initial data on server-side

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  showMetrics?: boolean;
  showNavigation?: boolean;
}

// Server-side layout configuration
const getLayoutConfig = () => ({
  navigation: {
    width: '240px',
    collapsible: true,
    position: 'left' as const
  },
  header: {
    height: '64px',
    sticky: true
  },
  content: {
    padding: '24px',
    maxWidth: '100%'
  }
});

// Header Client Component para evitar problemas de hidratação
const DashboardHeader: React.FC<{ currentPath?: string }> = ({ currentPath }) => {
  const [currentTime, setCurrentTime] = React.useState<string>('');
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    if (!isClient) return;
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, [isClient]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 relative">
      {/* Mobile menu - only visible on mobile */}
      <div className="md:hidden">
        <MobileMenu currentPath={currentPath} />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="ml-12 md:ml-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Dashboard de Monitoramento
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isClient ? currentTime : 'Carregando...'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Real-time status indicator */}
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">Tempo Real</span>
          </div>
          
          {/* Quick actions - hidden on small screens */}
          <div className="hidden sm:flex items-center space-x-2">
            <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Exportar Dados
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              Configurar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Main Dashboard Layout Server Component
export default function DashboardLayout({
  children,
  currentPath = '/',
  showMetrics = true,
  showNavigation = true
}: DashboardLayoutProps) {
  const config = getLayoutConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu - Only visible on mobile */}
      <div className="md:hidden">
        <MobileMenu currentPath={currentPath} />
      </div>

      {/* Navigation Sidebar - Hidden on mobile */}
      {showNavigation && (
        <aside className="hidden md:flex flex-shrink-0">
          <Navigation currentPath={currentPath} />
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader currentPath={currentPath} />

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="px-6 py-4">
            {/* Server-rendered metrics - Temporarily disabled to prevent hydration conflicts */}
            {/* {showMetrics && (
              <SuspenseWrapper type="dashboard">
                <DashboardMetrics />
              </SuspenseWrapper>
            )} */}

            {/* Dynamic content */}
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>© 2025 MedFasee Brasil</span>
              <span>•</span>
              <span>Versão 2.0.0</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span>Servidor: Online</span>
              <span>•</span>
              <span>Latência: &lt;50ms</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Responsive layout for mobile
export const MobileDashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentPath,
  showMetrics = true
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MF</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
          </div>
          
          <button className="p-2 text-gray-600 hover:text-gray-900">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Content */}
      <main className="p-4">
        {/* Temporarily disabled to prevent hydration conflicts */}
        {/* {showMetrics && (
          <div className="mb-6">
            <SuspenseWrapper type="dashboard">
              <DashboardMetrics />
            </SuspenseWrapper>
          </div>
        )} */}
        
        {children}
      </main>
    </div>
  );
};

// Layout metadata for SEO
export const layoutMetadata = {
  title: 'Dashboard - MedFasee Brasil',
  description: 'Sistema de monitoramento em tempo real para PMUs',
  keywords: 'PMU, monitoramento, energia elétrica, tempo real, dashboard'
};