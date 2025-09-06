'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: 'vertical' | 'horizontal' | 'both';
  scrollbarSize?: 'sm' | 'md' | 'lg';
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = 'vertical', scrollbarSize = 'md', ...props }, ref) => {
    const scrollbarClasses = {
      sm: 'scrollbar-thin',
      md: 'scrollbar',
      lg: 'scrollbar-thick'
    };

    const orientationClasses = {
      vertical: 'overflow-y-auto overflow-x-hidden',
      horizontal: 'overflow-x-auto overflow-y-hidden',
      both: 'overflow-auto'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          orientationClasses[orientation],
          scrollbarClasses[scrollbarSize],
          'scrollbar-track-slate-100 scrollbar-thumb-slate-300',
          'hover:scrollbar-thumb-slate-400',
          'dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600',
          'dark:hover:scrollbar-thumb-slate-500',
          'scrollbar-thumb-rounded scrollbar-track-rounded',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
export type { ScrollAreaProps };