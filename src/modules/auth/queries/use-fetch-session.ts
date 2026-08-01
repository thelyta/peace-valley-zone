import { queryOptions, useQuery } from "@tanstack/react-query";
import { authControllerSession } from "@/api/generated/auth/auth";
import { csrf } from "@/lib/csrf";
import { authKeys } from "@/modules/auth/query-keys";

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.session,
    queryFn: async () => {
      const session = await authControllerSession();
      csrf.set(session.csrfToken);
      return session;
    },
    retry: 1,
    staleTime: 60_000,
  });

export const useFetchSession = () => {
  return useQuery(sessionQueryOptions());
};
