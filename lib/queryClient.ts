import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      throwOnError: true,
      // don't retry on error, we want to fail fast, retry controls should be explicit and handled by the caller
      retry: false,
    }
  }
})
