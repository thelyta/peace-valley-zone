import { queryOptions, useQuery } from "@tanstack/react-query";
import { directoryControllerMembers } from "@/api/generated/directory/directory";
import { householdsKeys } from "@/modules/households/query-keys";

export const householdMembersQueryOptions = (zoneId: string, householdId: string) =>
  queryOptions({
    enabled: Boolean(zoneId && householdId),
    queryKey: householdsKeys.members.all(zoneId, householdId),
    queryFn: () => directoryControllerMembers(zoneId, householdId),
  });

export const useFetchHouseholdMembers = (zoneId: string, householdId: string) => {
  return useQuery(householdMembersQueryOptions(zoneId, householdId));
};
