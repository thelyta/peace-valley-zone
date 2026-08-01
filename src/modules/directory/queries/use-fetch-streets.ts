import { queryOptions, useQuery } from "@tanstack/react-query";
import { directoryControllerStreets } from "@/api/generated/directory/directory";
import { directoryKeys } from "@/modules/directory/query-keys";

export const streetsQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: directoryKeys.streets.all(zoneId),
    queryFn: () => directoryControllerStreets(zoneId),
  });

export const useFetchStreets = (zoneId: string) => {
  return useQuery(streetsQueryOptions(zoneId));
};
