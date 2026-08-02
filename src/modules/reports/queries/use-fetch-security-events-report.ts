import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ListSecurityEventsReportResponseDtoOutput } from "@/api/generated/estatelyAPI.schemas";
import { customInstance } from "@/lib/mutator";
import { reportsKeys } from "@/modules/reports/query-keys";
import { cleanFilters } from "@/modules/reports/utils/clean-filters";
import type { TSecurityEventsReportFilters } from "@/types/reports";

export const securityEventsReportQueryOptions = (
  zoneId: string,
  filters: TSecurityEventsReportFilters,
) => {
  const params = cleanFilters(filters);
  return queryOptions({
    enabled: Boolean(zoneId),
    queryKey: reportsKeys.securityEvents.list(zoneId, params),
    queryFn: () =>
      customInstance<ListSecurityEventsReportResponseDtoOutput>({
        url: `/v1/zones/${zoneId}/reports/security-events`,
        method: "GET",
        params,
      }),
  });
};

export const useFetchSecurityEventsReport = (
  zoneId: string,
  filters: TSecurityEventsReportFilters,
) => {
  return useQuery(securityEventsReportQueryOptions(zoneId, filters));
};
