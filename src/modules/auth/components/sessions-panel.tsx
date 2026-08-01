"use client";

import { Smartphone } from "lucide-react";
import { useState } from "react";
import { useRevokeOtherSessions } from "@/modules/auth/mutations/use-revoke-other-sessions";
import { useRevokeSession } from "@/modules/auth/mutations/use-revoke-session";
import { useFetchSessions } from "@/modules/auth/queries/use-fetch-sessions";
import type { TDeviceSession } from "@/types/auth";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Icon, Skeleton } from "@/ui";
import { formatDateTime } from "@/utils/dates";
import { userMessageForError } from "@/utils/error-messages";

type ConfirmTarget = { kind: "one"; session: TDeviceSession } | { kind: "others" } | null;

function sessionLabel(session: TDeviceSession) {
  const name = session.deviceName?.trim();
  if (name) {
    return name;
  }
  const summary = session.userAgentSummary?.trim();
  if (summary) {
    return summary;
  }
  return "Unknown device";
}

export function SessionsList() {
  const query = useFetchSessions();
  const revokeOne = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const [confirm, setConfirm] = useState<ConfirmTarget>(null);

  if (query.isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        error={userMessageForError(query.error, "Unable to load active sessions.")}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }

  const items = query.data.items;
  const hasOtherSessions = items.some((session) => !session.isCurrent);

  if (!items.length) {
    return (
      <EmptyState
        title="No active sessions"
        detail="You are not signed in on any devices right now."
        icon={<Icon icon={Smartphone} size={48} />}
      />
    );
  }

  const pending = revokeOne.isPending || revokeOthers.isPending;

  async function confirmAction() {
    if (!confirm) {
      return;
    }

    try {
      if (confirm.kind === "one") {
        await revokeOne.mutateAsync(confirm.session.id);
      } else {
        await revokeOthers.mutateAsync(undefined);
      }
      setConfirm(null);
    } catch {
      // Error toast comes from mutation onError (handleApiError).
    }
  }

  return (
    <section className="space-y-4">
      {hasOtherSessions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Sign out devices you no longer recognize or no longer use.
          </p>
          <Button
            type="button"
            variant="danger"
            className="min-h-11 shrink-0"
            disabled={pending}
            onClick={() => {
              setConfirm({ kind: "others" });
            }}
          >
            Sign out all other devices
          </Button>
        </div>
      ) : null}

      <ul className="space-y-3">
        {items.map((session) => {
          const label = sessionLabel(session);
          return (
            <li key={session.id}>
              <article className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{label}</p>
                    {session.deviceName?.trim() && session.userAgentSummary?.trim() ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {session.userAgentSummary}
                      </p>
                    ) : null}
                  </div>
                  {session.isCurrent ? <Badge tone="good">This device</Badge> : null}
                </div>
                <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-muted-foreground">First signed in</dt>
                    <dd>{formatDateTime(session.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Last active</dt>
                    <dd>{formatDateTime(session.lastSeenAt)}</dd>
                  </div>
                </dl>
                {!session.isCurrent ? (
                  <Button
                    type="button"
                    variant="danger"
                    className="mt-4 min-h-11"
                    disabled={pending}
                    onClick={() => {
                      setConfirm({ kind: "one", session });
                    }}
                  >
                    Sign out device
                  </Button>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirm?.kind === "one"}
        title="Sign out this device?"
        detail={
          confirm?.kind === "one"
            ? `“${sessionLabel(confirm.session)}” will need to sign in again.`
            : ""
        }
        confirmLabel="Sign out device"
        pending={revokeOne.isPending}
        onClose={() => {
          if (!revokeOne.isPending) {
            setConfirm(null);
          }
        }}
        onConfirm={() => {
          void confirmAction();
        }}
      />

      <ConfirmDialog
        open={confirm?.kind === "others"}
        title="Sign out all other devices?"
        detail="Every signed-in device except this one will be signed out immediately."
        confirmLabel="Sign out others"
        pending={revokeOthers.isPending}
        onClose={() => {
          if (!revokeOthers.isPending) {
            setConfirm(null);
          }
        }}
        onConfirm={() => {
          void confirmAction();
        }}
      />
    </section>
  );
}
