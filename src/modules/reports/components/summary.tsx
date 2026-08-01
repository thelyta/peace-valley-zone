"use client";

import Link from "next/link";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { hasPermission, Permission } from "@/modules/auth/utils/permission";
import { EmptyState, ErrorState, Skeleton } from "@/ui";
import { useFetchReportSummary } from "../queries/use-fetch-report-summary";

type ActionDoor = {
  href: string;
  label: string;
  detail: string;
};

export function AdminOverview({ zoneId }: { zoneId: string }) {
  const sessionQuery = useFetchSession();
  const session = sessionQuery.data;
  const canReadReports =
    session != null && hasPermission(session, zoneId, Permission.REPORTS_VISITORS_READ);
  const summary = useFetchReportSummary(zoneId, canReadReports);

  const actions: ActionDoor[] = [];
  if (session) {
    if (hasPermission(session, zoneId, Permission.HOUSEHOLDS_MANAGE)) {
      actions.push({
        href: "/admin/member-requests",
        label: "Member requests",
        detail: "Review who wants to join a home.",
      });
    }
    if (hasPermission(session, zoneId, Permission.DUES_MANAGE)) {
      actions.push({
        href: "/admin/dues",
        label: "Dues",
        detail: "Periods, eligibility, and payments.",
      });
    }
    if (hasPermission(session, zoneId, Permission.REPORTS_VISITORS_READ)) {
      actions.push({
        href: "/admin/security-events",
        label: "Security events",
        detail: "Gate checks and admissions today.",
      });
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">Zone office</h1>
      <p className="mt-2 text-muted-foreground">
        What needs attention in this zone. Use Manage above for the full directory.
      </p>

      {actions.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {actions.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="font-semibold text-foreground">{item.label}</span>
                <span className="mt-1 text-sm text-muted-foreground">{item.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : !sessionQuery.isLoading ? (
        <div className="mt-6">
          <EmptyState
            title="No quick actions for your role"
            detail="Open a section from Manage above when you need the full tools."
          />
        </div>
      ) : null}

      {canReadReports && summary.isPending ? <Skeleton className="mt-8 h-28 w-full" /> : null}
      {canReadReports && summary.isError ? (
        <div className="mt-8">
          <ErrorState error="Unable to load summary." retry={() => void summary.refetch()} />
        </div>
      ) : null}
      {canReadReports && summary.data ? (
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              ["Admissions", summary.data.admitted],
              ["Security events", summary.data.securityEvents],
              ["Dues eligible", summary.data.duesEligibleHouseholds],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
