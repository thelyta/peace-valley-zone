import { queryOptions, useQuery } from "@tanstack/react-query";
import { announcementsControllerList } from "@/api/generated/announcements/announcements";
import { announcementsKeys } from "@/modules/announcements/query-keys";

export const announcementsQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: announcementsKeys.all(zoneId),
    queryFn: () => announcementsControllerList(zoneId),
  });

export const useFetchAnnouncements = (zoneId: string) => {
  return useQuery(announcementsQueryOptions(zoneId));
};
