"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useRef } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Use a ref to persist the QueryClient across renders
  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000, // 30 seconds
        },
      },
    });
  }
  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
