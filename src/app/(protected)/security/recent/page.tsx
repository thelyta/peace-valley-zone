"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/app.store";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { RecentGateEvents, useFetchMyGates } from "@/modules/gate";
import { EmptyState, Skeleton } from "@/ui";

export default function SecurityRecentPage() {
  const { data, isLoading } = useFetchSession();
  const zoneId = useAppStore((state) => state.activeZoneId);
  const storedGateId = useAppStore((state) => state.activeGateId);
  const assignedIds = data?.zones.find((zone) => zone.zoneId === zoneId)?.gateIds ?? [];

  const gatesQuery = useFetchMyGates(zoneId ?? "");
  const gates = (gatesQuery.data?.items ?? []).filter((gate) => assignedIds.includes(gate.id));
  const gateId =
    (storedGateId && gates.some((gate) => gate.id === storedGateId) && storedGateId) ||
    gates[0]?.id;
  const gateName = gates.find((gate) => gate.id === gateId)?.name;

  if (isLoading || gatesQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!zoneId || !gateId) {
    return (
      <EmptyState
        title="No gate assigned"
        detail="Ask an administrator to assign a gate before viewing events."
      />
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recent gate events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {gateName ? `Gate: ${gateName}` : null}
            {data?.user.fullName ? ` · ${data.user.fullName}` : null}
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          href="/security"
        >
          Back to gate desk
        </Link>
      </header>
      <RecentGateEvents zoneId={zoneId} gateId={gateId} />
    </section>
  );
}
