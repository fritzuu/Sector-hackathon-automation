import { QueryClient } from '@tanstack/react-query';

// Configure the global React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5, 
      // Only retry once on failure (good for avoiding spamming Sectors API)
      retry: 1,
      // Don't refetch automatically when user switches browser tabs
      refetchOnWindowFocus: false,
    },
  },
});
