import { queryOptions, useQuery } from "@tanstack/react-query";
import { reportsControllerVisitors } from "@/api/generated/reports/reports";
import { reportsKeys } from "@/modules/reports/query-keys";
import type { TVisitorReportFilters } from "@/types/reports";

export const visitorReportQueryOptions = (zoneId: string, filters: TVisitorReportFilters) => {
  return queryOptions({
    enabled: Boolean(zoneId),
    queryKey: reportsKeys.visitors.list(zoneId, filters),
    queryFn: () => reportsControllerVisitors(zoneId, filters),
  });
};

export const useFetchVisitorReport = (zoneId: string, filters: TVisitorReportFilters) => {
  return useQuery(visitorReportQueryOptions(zoneId, filters));
};
