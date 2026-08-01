"use client";

import { useState } from "react";
import type { THouseholdMemberRequest } from "@/types/member-requests";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton, useToast } from "@/ui";
import { formatDateTime } from "@/utils/dates";
import { useCancelHouseholdMemberRequest } from "../mutations/use-cancel-household-member-request";
import { useFetchMyMemberRequests } from "../queries/use-fetch-my-member-requests";

function statusTone(status: THouseholdMemberRequest["status"]) {
  switch (status) {
    case "PENDING":
      return "warning" as const;
    case "APPROVED":
      return "good" as const;
    case "REJECTED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function MyMemberRequestsList({
  zoneId,
  householdId,
}: {
  zoneId: string;
  householdId: string;
}) {
  const toast = useToast();
  const query = useFetchMyMemberRequests(zoneId, householdId);
  const cancel = useCancelHouseholdMemberRequest(zoneId, householdId);
  const [cancelTarget, setCancelTarget] = useState<THouseholdMemberRequest | null>(null);

  if (query.isPending) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (query.isError) {
    return (
      <ErrorState error="Unable to load your member requests." retry={() => void query.refetch()} />
    );
  }

  const items = query.data.items;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Your member requests</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pending requests can be cancelled before an admin reviews them.
        </p>
      </div>

      {!items.length ? (
        <EmptyState title="No requests yet" detail="Submitted requests will show up here." />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold tracking-tight">{item.fullName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.relationship} · {item.email}
                  </p>
                </div>
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
              </div>
              {item.notes ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {item.notes}
                </p>
              ) : null}
              {item.reviewNote ? (
                <p className="mt-3 text-sm text-muted-foreground">Admin note: {item.reviewNote}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Submitted {formatDateTime(item.createdAt)}
                </p>
                {item.status === "PENDING" ? (
                  <Button variant="secondary" onClick={() => setCancelTarget(item)}>
                    Cancel request
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel this request?"
        detail={
          cancelTarget
            ? `Cancel the request to add ${cancelTarget.fullName}? Zone admins will be notified.`
            : ""
        }
        confirmLabel="Cancel request"
        pending={cancel.isPending}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (!cancelTarget) return;
          cancel.mutate(cancelTarget.id, {
            onSuccess: () => {
              toast("Member request cancelled.");
              setCancelTarget(null);
            },
          });
        }}
      />
    </section>
  );
}
