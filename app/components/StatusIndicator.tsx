'use client';

import React from 'react';
import { cn } from '../lib/utils';

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'online' | 'offline' | 'warning' | 'error' | 'loading';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
  animated?: boolean;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ 
    className, 
    status, 
    size = 'md', 
    label, 
    showLabel = false,
    animated = true,
    ...props 
  }, ref) => {
    const sizes = {
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4'
    };

    const statusConfig = {
      online: {
        color: 'bg-emerald-500',
        label: label || 'Online',
        animation: animated ? 'animate-pulse' : ''
      },
      offline: {
        color: 'bg-gray-400',
        label: label || 'Offline',
        animation: ''
      },
      warning: {
        color: 'bg-amber-500',
        label: label || 'Atenção',
        animation: animated ? 'animate-pulse' : ''
      },
      error: {
        color: 'bg-red-500',
        label: label || 'Erro',
        animation: animated ? 'animate-pulse' : ''
      },
      loading: {
        color: 'bg-blue-500',
        label: label || 'Carregando',
        animation: 'animate-spin'
      }
    };

    const config = statusConfig[status];

    return (
      <div 
        ref={ref} 
        className={cn('flex items-center space-x-2', className)} 
        {...props}
      >
        <div className={cn(
          'rounded-full',
          sizes[size],
          config.color,
          config.animation
        )} />
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {config.label}
          </span>
        )}
      </div>
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';

export { StatusIndicator };
export type { StatusIndicatorProps };