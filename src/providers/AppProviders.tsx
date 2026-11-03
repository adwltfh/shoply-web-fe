import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Catalog is bundled demo data; it does not go stale during a session.
        staleTime: Infinity,
        retry: 1,
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  // One client per app instance (and per static-render pass on web).
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
