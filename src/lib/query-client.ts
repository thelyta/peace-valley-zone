import { QueryClient } from "@tanstack/react-query";
import { ApiError, NetworkError, TimeoutError } from "./errors";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        retry: (attempt, error) =>
          attempt < 2 &&
          (error instanceof NetworkError ||
            error instanceof TimeoutError ||
            (error instanceof ApiError && error.status >= 500)),
      },
      mutations: { retry: false },
    },
  });
}
