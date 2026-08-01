import { queryOptions, useQuery } from "@tanstack/react-query";
import { directoryControllerGates } from "@/api/generated/directory/directory";
import { directoryKeys } from "@/modules/directory/query-keys";

export const gatesQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: directoryKeys.gates.all(zoneId),
    queryFn: () => directoryControllerGates(zoneId),
  });

export const useFetchGates = (zoneId: string) => {
  return useQuery(gatesQueryOptions(zoneId));
};
