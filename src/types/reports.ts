import type {
  ListSecurityEventsReportResponseDtoOutputItemsItem,
  ListVisitorReportsResponseDtoOutputItemsItem,
  ReportsControllerSecurityEventsParams,
  ReportsControllerVisitorsParams,
  ReportsSummaryResponseDtoOutput,
} from "@/api/generated/estatelyAPI.schemas";

export type TReportsSummary = ReportsSummaryResponseDtoOutput;
export type TVisitorReportItem = ListVisitorReportsResponseDtoOutputItemsItem;
export type TSecurityEventReportItem = ListSecurityEventsReportResponseDtoOutputItemsItem;

export type TVisitorReportFilters = ReportsControllerVisitorsParams;
export type TSecurityEventsReportFilters = ReportsControllerSecurityEventsParams;
