"use client";

import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { hasPermission, Permission } from "@/modules/auth/utils/permission";
import type { VisitorPassStatus } from "@/types/enums";
import type { TVisitorReportItem } from "@/types/reports";
import { Badge, Button, Field, SelectControl, ServerDataTable, useToast } from "@/ui";
import { formatDateTime } from "@/utils/dates";
import { userMessageForError } from "@/utils/error-messages";
import { useUrlState } from "@/utils/url-state";
import { useFetchVisitorReport } from "../queries/use-fetch-visitor-report";
import { exportVisitorsExcel } from "../utils/export-visitors-excel";

const STATUS_OPTIONS: Array<VisitorPassStatus | ""> = [
  "",
  "PENDING",
  "USED",
  "CANCELLED",
  "EXPIRED",
];

function statusTone(status: VisitorPassStatus) {
  switch (status) {
    case "USED":
      return "good" as const;
    case "PENDING":
      return "warning" as const;
    case "CANCELLED":
      return "danger" as const;
    case "EXPIRED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function VisitorsReport({ zoneId }: { zoneId: string }) {
  const toast = useToast();
  const { values, setValues } = useUrlState();
  const sessionQuery = useFetchSession();
  const [exporting, setExporting] = useState(false);

  const page = Math.max(1, Number(values.page ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(values.pageSize ?? "50") || 50));
  const status = values.status ?? "";
  const startDate = values.startDate ?? "";
  const endDate = values.endDate ?? "";

  const filters = {
    page,
    pageSize,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const query = useFetchVisitorReport(zoneId, filters);
  const canExport =
    sessionQuery.data != null &&
    hasPermission(sessionQuery.data, zoneId, Permission.REPORTS_EXPORT);

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize,
  };

  const columns = useMemo<ColumnDef<TVisitorReportItem, unknown>[]>(
    () => [
      {
        header: "Visitor",
        accessorKey: "visitorName",
      },
      {
        header: "Home",
        cell: ({ row }) => row.original.household,
      },
      // { header: "Gate", accessorKey: "gate" },
      {
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={statusTone(row.original.status)}>{row.original.status}</Badge>
        ),
      },
      { header: "People", accessorKey: "partySize" },
      { header: "Invited by", accessorKey: "invitedBy" },
      {
        header: "Created",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
    ],
    [],
  );

  async function onExport() {
    setExporting(true);
    try {
      await exportVisitorsExcel(zoneId, filters);
      toast("Export downloaded.");
    } catch (error) {
      toast(userMessageForError(error, "Unable to export Excel."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visitation log</h1>
          <p className="text-sm text-muted-foreground">{query.data?.total ?? 0} records</p>
        </div>
        {canExport && (
          <Button type="button" onClick={() => void onExport()} disabled={exporting}>
            {exporting ? "Exporting…" : "Export Excel"}
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Status">
          <SelectControl
            value={status}
            onValueChange={(value) =>
              setValues({ status: value || null, page: 1 }, { replace: true })
            }
            options={[
              { value: "", label: "All statuses" },
              ...STATUS_OPTIONS.filter(Boolean).map((option) => ({
                value: option,
                label: option,
              })),
            ]}
          />
        </Field>
        {/* <Field label="Gate">
          <SelectControl
            value={gateId}
            onValueChange={(value) =>
              setValues({ gateId: value || null, page: 1 }, { replace: true })
            }
            options={[
              { value: "", label: "All gates" },
              ...(gatesQuery.data?.items ?? []).map((gate) => ({
                value: gate.id,
                label: gate.name,
              })),
            ]}
          />
        </Field> */}
        <Field label="Page size">
          <SelectControl
            value={String(pageSize)}
            onValueChange={(value) => setValues({ pageSize: value, page: 1 }, { replace: true })}
            options={[25, 50, 100].map((size) => ({
              value: String(size),
              label: `${size} per page`,
            }))}
          />
        </Field>
        <Field label="From date">
          <input
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            type="date"
            value={startDate}
            onChange={(event) =>
              setValues({ startDate: event.target.value || null, page: 1 }, { replace: true })
            }
          />
        </Field>
        <Field label="To date">
          <input
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(event) =>
              setValues({ endDate: event.target.value || null, page: 1 }, { replace: true })
            }
          />
        </Field>
      </div>

      <ServerDataTable
        columns={columns}
        data={query.data?.items ?? []}
        total={query.data?.total ?? 0}
        loading={query.isPending}
        error={query.isError ? "Unable to load visitation log." : undefined}
        onRetry={() => void query.refetch()}
        empty="No visitor passes found."
        pagination={pagination}
        onPaginationChange={(updater) => {
          const next = typeof updater === "function" ? updater(pagination) : updater;
          setValues({ page: next.pageIndex + 1, pageSize: next.pageSize }, { replace: true });
        }}
        getRowId={(row) => row.id}
        mobileCard={(row) => (
          <article className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium">{row.visitorName}</p>
            <p className="text-sm text-muted-foreground">{row.household}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={statusTone(row.status)}>{row.status}</Badge>
              <Badge>{row.partySize} people</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Invited by {row.invitedBy} · {formatDateTime(row.createdAt)}
            </p>
          </article>
        )}
      />
    </section>
  );
}
