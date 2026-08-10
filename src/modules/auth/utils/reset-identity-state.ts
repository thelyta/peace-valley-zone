import type { QueryClient } from "@tanstack/react-query";
import { csrf } from "@/lib/csrf";

export async function resetIdentityState(queryClient: QueryClient, clearSelection: () => void) {
  await queryClient.cancelQueries();
  queryClient.clear();
  clearSelection();
  csrf.set(null);
}
