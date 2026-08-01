import { queryOptions, useQuery } from "@tanstack/react-query";
import { zonesControllerGet } from "@/api/generated/zones/zones";
import { zonesKeys } from "@/modules/zones/query-keys";

export const zoneQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: zonesKeys.detail.all(zoneId),
    queryFn: () => zonesControllerGet(zoneId),
  });

export const useFetchZone = (zoneId: string) => {
  return useQuery(zoneQueryOptions(zoneId));
};
