import { queryOptions, useQuery } from "@tanstack/react-query";
import { visitorPassesControllerList } from "@/api/generated/visitor-passes/visitor-passes";
import { visitorPassesKeys } from "@/modules/visitor-passes/query-keys";

export const visitorPassesQueryOptions = (zoneId: string, householdId: string) =>
  queryOptions({
    enabled: Boolean(zoneId && householdId),
    queryKey: visitorPassesKeys.passes.all(zoneId, householdId),
    queryFn: () => visitorPassesControllerList(zoneId, householdId),
  });

export const useFetchVisitorPasses = (zoneId: string, householdId: string) => {
  return useQuery(visitorPassesQueryOptions(zoneId, householdId));
};
