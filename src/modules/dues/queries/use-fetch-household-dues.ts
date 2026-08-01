import { queryOptions, useQuery } from "@tanstack/react-query";
import { duesControllerDues } from "@/api/generated/dues/dues";
import { duesKeys } from "@/modules/dues/query-keys";

export const householdDuesQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: duesKeys.householdDues.all(zoneId),
    queryFn: () => duesControllerDues(zoneId),
  });

export const useFetchHouseholdDues = (zoneId: string) => {
  return useQuery(householdDuesQueryOptions(zoneId));
};
