import { queryOptions, useQuery } from "@tanstack/react-query";
import { visitorPassesControllerVisitorEligibility } from "@/api/generated/visitor-passes/visitor-passes";
import { visitorPassesKeys } from "@/modules/visitor-passes/query-keys";

export const visitorEligibilityQueryOptions = (zoneId: string, householdId: string) =>
  queryOptions({
    enabled: Boolean(zoneId && householdId),
    queryKey: visitorPassesKeys.eligibility.all(zoneId, householdId),
    queryFn: () => visitorPassesControllerVisitorEligibility(zoneId, householdId),
  });

export const useFetchVisitorEligibility = (zoneId: string, householdId: string) => {
  return useQuery(visitorEligibilityQueryOptions(zoneId, householdId));
};
