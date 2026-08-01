import { queryOptions, useQuery } from "@tanstack/react-query";
import { duesControllerPeriods } from "@/api/generated/dues/dues";
import { duesKeys } from "@/modules/dues/query-keys";

export const duesPeriodsQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: duesKeys.periods.all(zoneId),
    queryFn: () => duesControllerPeriods(zoneId),
  });

export const useFetchDuesPeriods = (zoneId: string) => {
  return useQuery(duesPeriodsQueryOptions(zoneId));
};
