import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 5 minutes — no refetch during this window
        staleTime: 5 * 60 * 1000,
        // Cache persists for 30 minutes after last subscriber unmounts
        gcTime: 30 * 60 * 1000,
        // Retry twice with exponential backoff, then give up
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        // Don't refetch on window focus — prevents unnecessary API hits
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect unless data is stale
        refetchOnReconnect: "always",
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  // Server: always create a new client (no shared state between requests)
  if (typeof window === "undefined") return makeQueryClient();

  // Browser: reuse the same client across the session
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
