import { reportsControllerXlsx } from "@/api/generated/reports/reports";
import type { TVisitorReportFilters } from "@/types/reports";
import { downloadResponse } from "@/utils/download";

/** Binary download — not modeled usefully by Orval's void xlsx endpoint. */
export async function exportVisitorsExcel(zoneId: string, filters: TVisitorReportFilters) {
  const blob = await reportsControllerXlsx(zoneId, filters);
  await downloadResponse(blob, "visitors.xlsx");
}
