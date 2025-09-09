'use client';

import React from 'react';
import { cn } from '../lib/utils';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    className, 
    value, 
    max = 100, 
    size = 'md', 
    variant = 'default', 
    showLabel = false,
    label,
    animated = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    };

    const variants = {
      default: {
        track: 'bg-gray-200 dark:bg-gray-700',
        fill: 'bg-blue-500 dark:bg-blue-400'
      },
      success: {
        track: 'bg-emerald-200 dark:bg-emerald-800',
        fill: 'bg-emerald-500 dark:bg-emerald-400'
      },
      warning: {
        track: 'bg-orange-200 dark:bg-orange-800',
        fill: 'bg-orange-500 dark:bg-orange-400'
      },
      danger: {
        track: 'bg-red-200 dark:bg-red-800',
        fill: 'bg-red-500 dark:bg-red-400'
      },
      info: {
        track: 'bg-blue-200 dark:bg-blue-800',
        fill: 'bg-blue-500 dark:bg-blue-400'
      }
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {percentage.toFixed(1)}%
            </span>
          </div>
        )}
        <div className={cn(
          'w-full rounded-full overflow-hidden',
          sizes[size],
          variants[variant].track
        )}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-in-out',
              variants[variant].fill,
              animated && 'animate-pulse'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
export type { ProgressBarProps };