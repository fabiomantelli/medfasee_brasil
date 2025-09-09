'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configuração otimizada do QueryClient para dados de PMU
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 30 segundos (dados de PMU são atualizados frequentemente)
      staleTime: 30 * 1000,
      // Manter cache por 5 minutos
      gcTime: 5 * 60 * 1000,
      // Retry automático em caso de falha
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch quando a janela ganha foco
      refetchOnWindowFocus: true,
      // Refetch quando reconecta à internet
      refetchOnReconnect: true,
      // Não refetch automaticamente no mount se os dados são frescos
      refetchOnMount: 'always'
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

export default QueryProvider;
export { queryClient };