import type {
  ListSecurityEventsReportResponseDtoOutputItemsItem,
  ListVisitorReportsResponseDtoOutputItemsItem,
  ReportsSummaryResponseDtoOutput,
} from "@/api/generated/estatelyAPI.schemas";

export type TReportsSummary = ReportsSummaryResponseDtoOutput;
export type TVisitorReportItem = ListVisitorReportsResponseDtoOutputItemsItem;
export type TSecurityEventReportItem = ListSecurityEventsReportResponseDtoOutputItemsItem;

export type TVisitorReportFilters = {
  page?: number;
  pageSize?: number;
  status?: string;
  gateId?: string;
  startDate?: string;
  endDate?: string;
};

export type TSecurityEventsReportFilters = {
  page?: number;
  pageSize?: number;
  result?: string;
  gateId?: string;
  startDate?: string;
  endDate?: string;
};
