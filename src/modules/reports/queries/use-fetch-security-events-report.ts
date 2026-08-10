import { queryOptions, useQuery } from "@tanstack/react-query";
import { reportsControllerSecurityEvents } from "@/api/generated/reports/reports";
import { reportsKeys } from "@/modules/reports/query-keys";
import type { TSecurityEventsReportFilters } from "@/types/reports";

export const securityEventsReportQueryOptions = (
  zoneId: string,
  filters: TSecurityEventsReportFilters,
) => {
  return queryOptions({
    enabled: Boolean(zoneId),
    queryKey: reportsKeys.securityEvents.list(zoneId, filters),
    queryFn: () => reportsControllerSecurityEvents(zoneId, filters),
  });
};

export const useFetchSecurityEventsReport = (
  zoneId: string,
  filters: TSecurityEventsReportFilters,
) => {
  return useQuery(securityEventsReportQueryOptions(zoneId, filters));
};
