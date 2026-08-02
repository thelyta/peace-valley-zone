import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ListVisitorReportsResponseDtoOutput } from "@/api/generated/estatelyAPI.schemas";
import { customInstance } from "@/lib/mutator";
import { reportsKeys } from "@/modules/reports/query-keys";
import { cleanFilters } from "@/modules/reports/utils/clean-filters";
import type { TVisitorReportFilters } from "@/types/reports";

export const visitorReportQueryOptions = (zoneId: string, filters: TVisitorReportFilters) => {
  const params = cleanFilters(filters);
  return queryOptions({
    enabled: Boolean(zoneId),
    queryKey: reportsKeys.visitors.list(zoneId, params),
    queryFn: () =>
      customInstance<ListVisitorReportsResponseDtoOutput>({
        url: `/v1/zones/${zoneId}/reports/visitors`,
        method: "GET",
        params,
      }),
  });
};

export const useFetchVisitorReport = (zoneId: string, filters: TVisitorReportFilters) => {
  return useQuery(visitorReportQueryOptions(zoneId, filters));
};
