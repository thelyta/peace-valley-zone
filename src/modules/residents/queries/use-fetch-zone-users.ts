import { queryOptions, useQuery } from "@tanstack/react-query";
import { directoryControllerUsers } from "@/api/generated/directory/directory";
import { residentsKeys } from "@/modules/residents/query-keys";

export const zoneUsersQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: residentsKeys.users.all(zoneId),
    queryFn: () => directoryControllerUsers(zoneId),
  });

export const useFetchZoneUsers = (zoneId: string) => {
  return useQuery(zoneUsersQueryOptions(zoneId));
};
