import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { trpc, getTRPCClient } from '../lib/trpc';

interface TRPCProviderProps {
  children: React.ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  const { getToken } = useAuth();
  const [queryClient] = useState(() => new QueryClient());

  // Use useMemo to recreate client when getToken reference changes
  // This ensures fresh tokens are used after auth state changes
  const trpcClient = useMemo(() => getTRPCClient(getToken), [getToken]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
