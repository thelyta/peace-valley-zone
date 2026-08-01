"use client";

import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useMemo } from "react";
import { useFetchGates } from "@/modules/directory/queries/use-fetch-gates";
import type { GateVerificationResult } from "@/types/enums";
import type { TSecurityEventReportItem } from "@/types/reports";
import { Badge, Field, SelectControl, ServerDataTable } from "@/ui";
import { formatDateTime } from "@/utils/dates";
import { useUrlState } from "@/utils/url-state";
import { useFetchSecurityEventsReport } from "../queries/use-fetch-security-events-report";

const RESULT_OPTIONS: Array<GateVerificationResult | ""> = [
  "",
  "VALID",
  "ADMITTED",
  "INVALID",
  "EXPIRED",
  "ALREADY_USED",
  "CANCELLED",
  "DENIED",
  "WRONG_GATE",
];

function resultTone(result: GateVerificationResult) {
  switch (result) {
    case "VALID":
    case "ADMITTED":
      return "good" as const;
    case "EXPIRED":
    case "ALREADY_USED":
    case "CANCELLED":
      return "warning" as const;
    case "INVALID":
    case "DENIED":
    case "WRONG_GATE":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function SecurityEventsReport({ zoneId }: { zoneId: string }) {
  const { values, setValues } = useUrlState();
  const gatesQuery = useFetchGates(zoneId);

  const page = Math.max(1, Number(values.page ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(values.pageSize ?? "50") || 50));
  const result = values.result ?? "";
  const gateId = values.gateId ?? "";

  const filters = {
    page,
    pageSize,
    result: result || undefined,
    gateId: gateId || undefined,
  };

  const query = useFetchSecurityEventsReport(zoneId, filters);

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize,
  };

  const columns = useMemo<ColumnDef<TSecurityEventReportItem, unknown>[]>(
    () => [
      {
        header: "When",
        cell: ({ row }) => formatDateTime(row.original.occurredAt),
      },
      {
        header: "Result",
        cell: ({ row }) => (
          <Badge tone={resultTone(row.original.result)}>{row.original.result}</Badge>
        ),
      },
      { header: "Gate", accessorKey: "gate" },
      { header: "Visitor", accessorKey: "visitorName" },
      { header: "Guard", accessorKey: "securityUser" },
    ],
    [],
  );

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security events</h1>
        <p className="text-sm text-muted-foreground">{query.data?.total ?? 0} records</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Result">
          <SelectControl
            value={result}
            onValueChange={(value) =>
              setValues({ result: value || null, page: 1 }, { replace: true })
            }
            options={[
              { value: "", label: "All results" },
              ...RESULT_OPTIONS.filter(Boolean).map((option) => ({
                value: option,
                label: option,
              })),
            ]}
          />
        </Field>
        <Field label="Gate">
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
        </Field>
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
      </div>

      <ServerDataTable
        columns={columns}
        data={query.data?.items ?? []}
        total={query.data?.total ?? 0}
        loading={query.isPending}
        error={query.isError ? "Unable to load security events." : undefined}
        onRetry={() => void query.refetch()}
        empty="No security events found."
        pagination={pagination}
        onPaginationChange={(updater) => {
          const next = typeof updater === "function" ? updater(pagination) : updater;
          setValues({ page: next.pageIndex + 1, pageSize: next.pageSize }, { replace: true });
        }}
        getRowId={(row) => row.id}
        mobileCard={(row) => (
          <article className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium">{row.visitorName || "Unknown visitor"}</p>
            <p className="text-sm text-muted-foreground">
              {row.gate} · {row.securityUser}
            </p>
            <div className="mt-2">
              <Badge tone={resultTone(row.result)}>{row.result}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(row.occurredAt)}</p>
          </article>
        )}
      />
    </section>
  );
}
