import { queryOptions, useQuery } from "@tanstack/react-query";
import { directoryControllerMyMemberRequests } from "@/api/generated/directory/directory";
import { householdsKeys } from "@/modules/households/query-keys";

export const myMemberRequestsQueryOptions = (zoneId: string, householdId: string) =>
  queryOptions({
    enabled: Boolean(zoneId && householdId),
    queryKey: householdsKeys.memberRequests.mine(zoneId, householdId),
    queryFn: () => directoryControllerMyMemberRequests(zoneId, householdId),
  });

export const useFetchMyMemberRequests = (zoneId: string, householdId: string) => {
  return useQuery(myMemberRequestsQueryOptions(zoneId, householdId));
};
