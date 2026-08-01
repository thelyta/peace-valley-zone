import { queryOptions, useQuery } from "@tanstack/react-query";
import { authControllerListSessions } from "@/api/generated/auth/auth";
import { authKeys } from "@/modules/auth/query-keys";

export const sessionsQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.sessions,
    queryFn: () => authControllerListSessions(),
  });

export const useFetchSessions = () => {
  return useQuery(sessionsQueryOptions());
};
