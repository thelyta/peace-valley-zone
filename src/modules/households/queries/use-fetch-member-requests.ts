import { queryOptions, useQuery } from "@tanstack/react-query";
import { directoryControllerMemberRequests } from "@/api/generated/directory/directory";
import { householdsKeys } from "@/modules/households/query-keys";

export const memberRequestsQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: householdsKeys.memberRequests.all(zoneId),
    queryFn: () => directoryControllerMemberRequests(zoneId),
  });

export const useFetchMemberRequests = (zoneId: string) => {
  return useQuery(memberRequestsQueryOptions(zoneId));
};
