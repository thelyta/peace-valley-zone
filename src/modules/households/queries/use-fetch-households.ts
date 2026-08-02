import { queryOptions, useQuery } from "@tanstack/react-query";
import { directoryControllerHouseholds } from "@/api/generated/directory/directory";
import { householdsKeys } from "@/modules/households/query-keys";
import type { THouseholdsResponse } from "@/types/households";

export const householdsQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: householdsKeys.households.all(zoneId),
    queryFn: async (): Promise<THouseholdsResponse> =>
      directoryControllerHouseholds(zoneId) as Promise<THouseholdsResponse>,
  });

export const useFetchHouseholds = (zoneId: string) => {
  return useQuery(householdsQueryOptions(zoneId));
};
