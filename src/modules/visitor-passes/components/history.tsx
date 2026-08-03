"use client";

import { Ticket } from "lucide-react";
import { useState } from "react";
import type { TVisitorPass } from "@/types/visitor-passes";
import { Badge, ConfirmDialog, EmptyState, ErrorState, Icon, Skeleton, useToast } from "@/ui";
import { formatDateTime } from "@/utils/dates";
import { userMessageForError } from "@/utils/error-messages";
import { toTitleCase } from "@/utils/string";
import { useCancelVisitorPass } from "../mutations/use-cancel-visitor-pass";
import { useRevealVisitorPass } from "../mutations/use-reveal-visitor-pass";
import { useFetchVisitorPasses } from "../queries/use-fetch-visitor-passes";
import { GateTicketSheet, type ShareableVisitorPass } from "./gate-ticket-sheet";

function statusTone(status: string): "neutral" | "good" | "warning" | "danger" {
  switch (status) {
    case "PENDING":
      return "warning";
    case "USED":
      return "good";
    case "EXPIRED":
      return "danger";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}

export function VisitorHistory({
  zoneId,
  householdId,
  limit,
}: {
  zoneId: string;
  householdId: string;
  limit?: number;
}) {
  const toast = useToast();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [sharePass, setSharePass] = useState<ShareableVisitorPass | null>(null);
  const query = useFetchVisitorPasses(zoneId, householdId);
  const cancel = useCancelVisitorPass(zoneId, householdId);
  const reveal = useRevealVisitorPass(zoneId, householdId);

  function confirmCancel(passId: string) {
    cancel.mutate(passId, {
      onSuccess: () => {
        setCancelId(null);
        toast("Visitor pass cancelled.");
      },
    });
  }

  async function openShare(pass: TVisitorPass) {
    if (pass.status !== "PENDING") {
      toast("This pass code is no longer available.");
      return;
    }
    try {
      const result = await reveal.mutateAsync(pass.id);
      const code = result.code ?? result.humanCode;
      if (!code || !result.qrPayload) {
        toast(
          "This pass code is no longer available. Cancel it and create a new one to share again.",
        );
        return;
      }
      setSharePass({ ...result, code, qrPayload: result.qrPayload });
    } catch (error) {
      toast(userMessageForError(error, "Could not open this visitor pass."));
    }
  }

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState error="We could not load visitor passes." retry={() => void query.refetch()} />
    );
  }

  const items = limit ? (query.data?.items ?? []).slice(0, limit) : (query.data?.items ?? []);

  if (!items.length) {
    return (
      <EmptyState
        title="No visitor passes yet"
        detail="Passes you create will appear here."
        icon={<Icon icon={Ticket} size={48} />}
      />
    );
  }

  const pendingPass = items.find((pass) => pass.id === cancelId);

  return (
    <>
      <section className="space-y-3">
        {items.map((pass) => (
          <VisitorPassCard
            key={pass.id}
            pass={pass}
            opening={reveal.isPending && reveal.variables === pass.id}
            onOpen={() => void openShare(pass)}
            onCancel={() => setCancelId(pass.id)}
            cancelPending={cancel.isPending && cancelId === pass.id}
          />
        ))}
      </section>
      {sharePass ? (
        <GateTicketSheet pass={sharePass} open onClose={() => setSharePass(null)} />
      ) : null}
      <ConfirmDialog
        open={Boolean(cancelId)}
        title="Cancel visitor pass?"
        detail={
          pendingPass
            ? `Cancel the pending pass for ${pendingPass.visitorName}? They will no longer be able to enter with this code.`
            : "Cancel this pending visitor pass?"
        }
        confirmLabel="Cancel pass"
        pending={cancel.isPending}
        onClose={() => {
          if (!cancel.isPending) {
            setCancelId(null);
          }
        }}
        onConfirm={() => {
          if (cancelId) {
            confirmCancel(cancelId);
          }
        }}
      />
    </>
  );
}

function VisitorPassCard({
  pass,
  opening,
  onOpen,
  onCancel,
  cancelPending,
}: {
  pass: TVisitorPass;
  opening: boolean;
  onOpen: () => void;
  onCancel: () => void;
  cancelPending: boolean;
}) {
  const street = pass.destinationStreet?.name
    ? toTitleCase(pass.destinationStreet.name)
    : undefined;
  const gate = pass.destinationGate?.name ? toTitleCase(pass.destinationGate.name) : undefined;
  const canOpen = pass.status === "PENDING";

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex justify-between gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          onClick={onOpen}
          disabled={opening}
          aria-label={
            canOpen
              ? `View visitor pass for ${pass.visitorName}`
              : `Visitor pass for ${pass.visitorName} is no longer shareable`
          }
        >
          <p className="font-medium text-foreground">{pass.visitorName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Code ending {pass.codeHint} · {pass.partySize}{" "}
            {pass.partySize === 1 ? "person" : "people"}
            {canOpen ? (opening ? " · Opening…" : " · Tap to share") : null}
          </p>
          {street || gate ? (
            <p className="text-sm text-muted-foreground">
              {[street, gate].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">Expires {formatDateTime(pass.expiresAt)}</p>
        </button>
        <div className="text-right">
          <Badge tone={statusTone(pass.status)}>{pass.status}</Badge>
          {pass.status === "PENDING" ? (
            <button
              type="button"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-destructive underline-offset-4 hover:underline disabled:opacity-50"
              disabled={cancelPending || opening}
              onClick={(event) => {
                event.stopPropagation();
                onCancel();
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
