"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button, Dialog, EmptyState, ErrorState, Skeleton, useToast } from "@/ui";
import { useSetSecurityGateAssignments } from "../mutations/use-set-security-gate-assignments";
import { gatesQueryOptions } from "../queries/use-fetch-gates";

export function AssignSecurityGatesDialog({
  zoneId,
  open,
  membershipId,
  personName,
  assignedGateNames,
  onClose,
}: {
  zoneId: string;
  open: boolean;
  membershipId: string;
  personName: string;
  assignedGateNames: string[];
  onClose: () => void;
}) {
  const toast = useToast();
  const gatesQuery = useQuery({
    ...gatesQueryOptions(zoneId),
    enabled: open,
  });
  const [gateIds, setGateIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !gatesQuery.data) {
      return;
    }
    const nameSet = new Set(assignedGateNames);
    setGateIds(
      gatesQuery.data.items.filter((gate) => nameSet.has(gate.name)).map((gate) => gate.id),
    );
  }, [assignedGateNames, gatesQuery.data, open]);

  const save = useSetSecurityGateAssignments(zoneId);

  function submit() {
    save.mutate(
      { membershipId, body: { gateIds } },
      {
        onSuccess: () => {
          toast("Gate assignments updated.");
          onClose();
        },
      },
    );
  }

  function toggle(gateId: string) {
    setGateIds((current) =>
      current.includes(gateId) ? current.filter((id) => id !== gateId) : [...current, gateId],
    );
  }

  return (
    <Dialog open={open} title={`Assign gates — ${personName}`} onClose={onClose}>
      {gatesQuery.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : gatesQuery.isError ? (
        <ErrorState error="Unable to load gates." retry={() => void gatesQuery.refetch()} />
      ) : !gatesQuery.data.items.length ? (
        <EmptyState title="No gates available" detail="Create gates before assigning security." />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose which gates this security officer can verify.
          </p>
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {gatesQuery.data.items.map((gate) => (
              <li key={gate.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={gateIds.includes(gate.id)}
                    onChange={() => toggle(gate.id)}
                  />
                  <span>
                    {gate.name}
                    {gate.status !== "ACTIVE" ? " (inactive)" : ""}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save assignments"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
