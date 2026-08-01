"use client";

import { useState } from "react";
import type { THouseholdMemberRequest } from "@/types/member-requests";
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Skeleton,
  Textarea,
  useToast,
} from "@/ui";
import { formatDateTime } from "@/utils/dates";
import {
  useApproveHouseholdMemberRequest,
  useRejectHouseholdMemberRequest,
} from "../mutations/use-review-household-member-request";
import { useFetchMemberRequests } from "../queries/use-fetch-member-requests";

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

function RequestDetails({ item }: { item: THouseholdMemberRequest }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold tracking-tight">{item.fullName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.household.address}</p>
        </div>
        <Badge tone={statusTone(item.status)}>{item.status}</Badge>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium">{item.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="font-medium">{item.phoneE164 ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Relationship</dt>
          <dd className="font-medium">{item.relationship}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Requested by</dt>
          <dd className="font-medium">{item.requestedBy.fullName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Submitted</dt>
          <dd className="font-medium">{formatDateTime(item.createdAt)}</dd>
        </div>
        {item.reviewedAt ? (
          <div>
            <dt className="text-muted-foreground">Reviewed</dt>
            <dd className="font-medium">{formatDateTime(item.reviewedAt)}</dd>
          </div>
        ) : null}
      </dl>
      {item.notes ? (
        <div className="text-sm">
          <p className="text-muted-foreground">Resident&apos;s notes</p>
          <p className="mt-1 whitespace-pre-wrap font-medium text-foreground">{item.notes}</p>
        </div>
      ) : null}
      {item.reviewNote ? (
        <div className="text-sm">
          <p className="text-muted-foreground">Review note</p>
          <p className="mt-1 whitespace-pre-wrap font-medium text-foreground">{item.reviewNote}</p>
        </div>
      ) : null}
    </div>
  );
}

export function MemberRequestsList({ zoneId }: { zoneId: string }) {
  const toast = useToast();
  const query = useFetchMemberRequests(zoneId);
  const approve = useApproveHouseholdMemberRequest(zoneId);
  const reject = useRejectHouseholdMemberRequest(zoneId);
  const [selected, setSelected] = useState<THouseholdMemberRequest | null>(null);
  const [approveTarget, setApproveTarget] = useState<THouseholdMemberRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<THouseholdMemberRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  if (query.isPending) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (query.isError) {
    return (
      <ErrorState error="Unable to load member requests." retry={() => void query.refetch()} />
    );
  }

  const items = query.data.items;

  function openReject(item: THouseholdMemberRequest) {
    setRejectNote("");
    setRejectTarget(item);
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Member requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Requests from primary house members to add people to a household.
        </p>
      </div>

      {!items.length ? (
        <EmptyState title="No member requests" detail="New requests will appear here." />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold tracking-tight">{item.fullName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.household.address}</p>
                  </div>
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {item.relationship} · {item.requestedBy.fullName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submitted {formatDateTime(item.createdAt)}
                </p>
                <Button className="mt-4" variant="secondary" onClick={() => setSelected(item)}>
                  View details
                </Button>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Household</th>
                  <th className="px-4 py-3 font-semibold">Relationship</th>
                  <th className="px-4 py-3 font-semibold">Requested by</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-t border-border" key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.fullName}</p>
                      <p className="text-muted-foreground">{item.email}</p>
                    </td>
                    <td className="px-4 py-3">{item.household.address}</td>
                    <td className="px-4 py-3">{item.relationship}</td>
                    <td className="px-4 py-3">{item.requestedBy.fullName}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatDateTime(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button variant="secondary" onClick={() => setSelected(item)}>
                        View details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog
        open={Boolean(selected)}
        title="Member request"
        onClose={() => setSelected(null)}
        className="sm:max-w-xl"
      >
        {selected ? (
          <div className="space-y-5">
            <RequestDetails item={selected} />
            {selected.status === "PENDING" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setApproveTarget(selected);
                  }}
                >
                  Approve
                </Button>
                <Button variant="destructive" onClick={() => openReject(selected)}>
                  Reject
                </Button>
              </div>
            ) : null}
            <Button variant="ghost" className="w-full" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={Boolean(approveTarget)}
        title="Approve this request?"
        detail={
          approveTarget
            ? `Add ${approveTarget.fullName} to ${approveTarget.household.address} and notify the requester.`
            : ""
        }
        confirmLabel="Approve"
        tone="primary"
        pending={approve.isPending}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => {
          if (!approveTarget) return;
          approve.mutate(
            { requestId: approveTarget.id, body: {} },
            {
              onSuccess: () => {
                toast("Member request approved.");
                setApproveTarget(null);
                setSelected(null);
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Reject this request?"
        detail={
          rejectTarget
            ? `Reject the request to add ${rejectTarget.fullName}? The requester will be notified.`
            : ""
        }
        confirmLabel="Reject"
        pending={reject.isPending}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => {
          if (!rejectTarget) return;
          const note = rejectNote.trim();
          reject.mutate(
            {
              requestId: rejectTarget.id,
              body: note ? { reviewNote: note } : {},
            },
            {
              onSuccess: () => {
                toast("Member request rejected.");
                setRejectTarget(null);
                setRejectNote("");
                setSelected(null);
              },
            },
          );
        }}
      >
        <Field label="Note to requester (optional)">
          <Textarea
            rows={3}
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
          />
        </Field>
      </ConfirmDialog>
    </section>
  );
}
