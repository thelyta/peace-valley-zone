import { queryOptions, useQuery } from "@tanstack/react-query";
import { visitorPassesControllerEntryGates } from "@/api/generated/visitor-passes/visitor-passes";
import { visitorPassesKeys } from "@/modules/visitor-passes/query-keys";

export const entryGatesQueryOptions = (zoneId: string, householdId: string) =>
  queryOptions({
    enabled: Boolean(zoneId && householdId),
    queryKey: visitorPassesKeys.entryGates.all(zoneId, householdId),
    queryFn: () => visitorPassesControllerEntryGates(zoneId, householdId),
  });

export const useFetchEntryGates = (zoneId: string, householdId: string) => {
  return useQuery(entryGatesQueryOptions(zoneId, householdId));
};
