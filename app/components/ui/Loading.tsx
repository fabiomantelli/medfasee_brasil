'use client';

import React, { Suspense } from 'react';
import Image from 'next/image';
import { Loader2, Zap, Activity } from 'lucide-react';
import { DashboardSkeleton, ChartSkeleton, MapSkeleton, TableSkeleton } from './Skeleton';
import { cn } from '../../lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'pulse' | 'dots' | 'bars';
  text?: string;
  className?: string;
}

// Modern loading spinner with variants
export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const renderVariant = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
        );
      
      case 'pulse':
        return (
          <div className={cn('rounded-full bg-blue-600 animate-pulse', sizeClasses[size])} />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-blue-600 animate-bounce',
                  size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );
      
      case 'bars':
        return (
          <div className="flex space-x-1 items-end">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'bg-blue-600 animate-pulse',
                  size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : 'w-2'
                )}
                style={{
                  height: size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px',
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        );
      
      default:
        return (
          <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
        );
    }
  };

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      {renderVariant()}
      {text && (
        <span className={cn(
          'text-gray-600 animate-pulse',
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
        )}>
          {text}
        </span>
      )}
    </div>
  );
};

// Full page loading with modern design
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 mx-auto">
            <Zap className="h-16 w-16 text-blue-600 animate-pulse" />
          </div>
          <div className="absolute inset-0 h-16 w-16 mx-auto">
            <div className="h-16 w-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-800">{message}</h2>
          <p className="text-gray-600">Preparando sua experiência...</p>
        </div>
      </div>
    </div>
  );
};

// Card loading with skeleton
export const CardLoading: React.FC<{ title?: string; className?: string }> = ({ 
  title = 'Carregando dados...', 
  className 
}) => {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border p-6', className)}>
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
        <span className="text-gray-700 font-medium">{title}</span>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
};

// Inline loading for buttons and small components
export const InlineLoading: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  return (
    <Loader2 className={cn(
      'animate-spin',
      size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    )} />
  );
};

// Suspense wrapper with modern loading states
interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  type?: 'dashboard' | 'chart' | 'map' | 'table' | 'card' | 'page';
}

export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({ 
  children, 
  fallback, 
  type = 'card' 
}) => {
  const getFallback = () => {
    if (fallback) return fallback;
    
    switch (type) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'chart':
        return <ChartSkeleton />;
      case 'map':
        return <MapSkeleton />;
      case 'table':
        return <TableSkeleton />;
      case 'page':
        return <PageLoading />;
      default:
        return <CardLoading />;
    }
  };

  return (
    <Suspense fallback={getFallback()}>
      {children}
    </Suspense>
  );
};

// Progressive loading for images
interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loading size="md" variant="spinner" />
        </div>
      )}
      
      <Image
        src={error ? placeholder : src}
        alt={alt}
        fill
        className={cn(
          'transition-opacity duration-300 object-cover',
          loading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
};

// Loading overlay for existing content
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  message = 'Carregando...',
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-2">
            <Loading size="lg" variant="spinner" />
            <p className="text-gray-600 font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loading;