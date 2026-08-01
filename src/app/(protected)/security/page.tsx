"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/app.store";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { GatePanel, RecentGateEvents, useFetchMyGates } from "@/modules/gate";
import {
  EmptyState,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/ui";

export default function SecurityPage() {
  const { data, isLoading } = useFetchSession();
  const zoneId = useAppStore((state) => state.activeZoneId);
  const gateId = useAppStore((state) => state.activeGateId);
  const setGate = useAppStore((state) => state.setActiveGateId);
  const consumePendingVisitorCode = useAppStore((state) => state.consumePendingVisitorCode);
  const [initialCode, setInitialCode] = useState("");

  const assignedIds = data?.zones.find((zone) => zone.zoneId === zoneId)?.gateIds ?? [];
  const gatesQuery = useFetchMyGates(zoneId ?? "");
  const gates = (gatesQuery.data?.items ?? []).filter((gate) => assignedIds.includes(gate.id));
  const selected = gateId && gates.some((gate) => gate.id === gateId) ? gateId : gates[0]?.id;
  const selectedGate = gates.find((gate) => gate.id === selected);

  useEffect(() => {
    if (selected && selected !== gateId) {
      setGate(selected);
    }
  }, [gateId, selected, setGate]);

  useEffect(() => {
    const pending = consumePendingVisitorCode();
    if (pending) {
      setInitialCode(pending);
    }
  }, [consumePendingVisitorCode]);

  if (isLoading || gatesQuery.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!zoneId || !selected || !selectedGate) {
    return (
      <EmptyState
        title="No gate assigned"
        detail="Ask an administrator to assign a gate before checking passes."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground">
        If this desk is offline, do not admit a visitor from a screenshot, code, or verbal
        confirmation. Reconnect and verify the pass in this system, or follow your approved manual
        gate procedure.
      </p>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Gate desk</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-primary">
            {selectedGate.name}
          </h1>
        </div>
        {gates.length > 1 ? (
          <div className="min-w-52 space-y-1.5">
            <Label htmlFor="gate-select">Switch gate</Label>
            <Select value={selected} onValueChange={setGate}>
              <SelectTrigger id="gate-select">
                <SelectValue placeholder="Choose gate" />
              </SelectTrigger>
              <SelectContent>
                {gates.map((gate) => (
                  <SelectItem key={gate.id} value={gate.id}>
                    {gate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <GatePanel zoneId={zoneId} gateId={selected} initialCode={initialCode} />
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link
              href="/security/recent"
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              View all events
            </Link>
          </div>
          <RecentGateEvents zoneId={zoneId} gateId={selected} />
        </div>
      </div>
    </div>
  );
}
