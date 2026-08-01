import { queryOptions, useQuery } from "@tanstack/react-query";
import { reportsControllerSummary } from "@/api/generated/reports/reports";
import { reportsKeys } from "@/modules/reports/query-keys";

export const reportSummaryQueryOptions = (zoneId: string) =>
  queryOptions({
    enabled: Boolean(zoneId),
    queryKey: reportsKeys.summary.all(zoneId),
    queryFn: () => reportsControllerSummary(zoneId),
  });

export const useFetchReportSummary = (zoneId: string, enabled = true) => {
  return useQuery({
    ...reportSummaryQueryOptions(zoneId),
    enabled: enabled && Boolean(zoneId),
  });
};
