import { api } from "@/lib/client";
import type { TVisitorReportFilters } from "@/types/reports";
import { downloadResponse } from "@/utils/download";
import { cleanFilters } from "../utils/clean-filters";

/** Binary download — not modeled usefully by Orval's void xlsx endpoint. */
export async function exportVisitorsExcel(zoneId: string, filters: TVisitorReportFilters) {
  const response = await api.download(`/v1/zones/${zoneId}/reports/visitors.xlsx`, {
    query: cleanFilters(filters),
  });
  await downloadResponse(response, "visitors.xlsx");
}
