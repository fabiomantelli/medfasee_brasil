'use client';

import React from 'react';
import { Home, BarChart3, Map, Settings, Bell, User } from 'lucide-react';

// Server Component for navigation - renders on server for better performance

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  badge?: number;
}

interface NavigationProps {
  currentPath?: string;
}

// Static navigation items - computed on server
const getNavigationItems = (currentPath = '/'): NavItem[] => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="h-5 w-5" />,
    href: '/',
    active: currentPath === '/'
  },
  {
    id: 'analytics',
    label: 'Análises',
    icon: <BarChart3 className="h-5 w-5" />,
    href: '/',
    active: currentPath === '/analytics'
  },
  {
    id: 'map',
    label: 'Mapa',
    icon: <Map className="h-5 w-5" />,
    href: '/',
    active: currentPath === '/map'
  },
  {
    id: 'notifications',
    label: 'Notificações',
    icon: <Bell className="h-5 w-5" />,
    href: '/',
    active: currentPath === '/notifications',
    badge: 3 // This would come from server-side data
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: <Settings className="h-5 w-5" />,
    href: '/',
    active: currentPath === '/settings'
  }
];

// Server Component for user info
const LastUpdateTime: React.FC = () => {
  const [lastUpdate, setLastUpdate] = React.useState<string>('');
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    if (!isClient) return;
    
    const updateTime = () => {
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 30000);
    
    return () => clearInterval(interval);
  }, [isClient]);

  return (
    <p className="text-xs text-gray-500 mt-1">
      Última atualização: {isClient ? lastUpdate : '--:--:--'}
    </p>
  );
};

const UserInfo: React.FC = () => {
  // In a real app, this would fetch user data server-side
  const user = {
    name: 'Operador Sistema',
    role: 'Administrador',
    avatar: null
  };

  return (
    <div className="flex items-center space-x-3 p-4 border-t border-gray-200">
      <div className="flex-shrink-0">
        {user.avatar ? (
          <img
            className="h-8 w-8 rounded-full"
            src={user.avatar}
            alt={user.name}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user.role}
        </p>
      </div>
    </div>
  );
};

// Main Navigation Server Component
export default function Navigation({ currentPath }: NavigationProps) {
  const navItems = getNavigationItems(currentPath);

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 h-full flex flex-col w-60">
      {/* Logo/Brand */}
      <div className="px-6 py-5 border-b border-gray-200" style={{paddingBottom: 'calc(1.25rem + 4px)'}}>
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">MF</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">MedFasee</h1>
            <p className="text-xs text-gray-500">Brasil</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`
              flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
              ${
                item.active
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            
            {item.badge && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* System Status */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-600">Sistema Online</span>
        </div>
        <LastUpdateTime />
      </div>

      {/* User Info */}
      <UserInfo />
    </nav>
  );
}

// Export navigation items for use in other components
export { getNavigationItems };
export type { NavItem };