import { queryOptions, useQuery } from "@tanstack/react-query";
import { zonesControllerMyGates } from "@/api/generated/zones/zones";
import { gateKeys } from "@/modules/gate/query-keys";

export const myGatesQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: gateKeys.myGates.all(zoneId),
    queryFn: () => zonesControllerMyGates(zoneId),
  });

export const useFetchMyGates = (zoneId: string) => {
  return useQuery(myGatesQueryOptions(zoneId));
};
