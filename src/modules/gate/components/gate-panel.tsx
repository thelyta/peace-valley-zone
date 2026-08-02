"use client";

import { CheckCircle2, ScanLine, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge, Button, EmptyState, Field, Icon, Input, Skeleton } from "@/ui";
import { formatDateTime } from "@/utils/dates";
import { userMessageForError } from "@/utils/error-messages";
import { useAdmitVisitor } from "../mutations/use-admit-visitor";
import { useVerifyVisitor } from "../mutations/use-verify-visitor";
import { useFetchGateEvents } from "../queries/use-fetch-gate-events";

export type { TGateEvent, TMyGate } from "@/types/gate";
export { myGatesQueryOptions, useFetchMyGates } from "../queries/use-fetch-my-gates";

function resultTone(result: string): "neutral" | "good" | "warning" | "danger" {
  switch (result) {
    case "VALID":
    case "ADMITTED":
      return "good";
    case "EXPIRED":
    case "ALREADY_USED":
    case "CANCELLED":
    case "WRONG_GATE":
    case "DENIED":
    case "INVALID":
      return "danger";
    default:
      return "neutral";
  }
}

function StatusPlane({
  tone,
  title,
  detail,
  icon,
}: {
  tone: "good" | "danger" | "warning" | "neutral";
  title: string;
  detail?: string;
  icon: typeof CheckCircle2;
}) {
  const tones = {
    good: "bg-success-soft text-success-soft-foreground border-success/25",
    danger: "bg-destructive/10 text-destructive border-destructive/25",
    warning: "bg-warning-soft text-warning-soft-foreground border-warning/25",
    neutral: "bg-muted text-foreground border-border",
  };
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border px-4 py-6 text-center",
        tones[tone],
      )}
    >
      <Icon icon={icon} size={32} />
      <p className="text-2xl font-bold tracking-tight uppercase sm:text-3xl">{title}</p>
      {detail ? <p className="max-w-sm text-sm font-medium opacity-90">{detail}</p> : null}
    </div>
  );
}

export function GatePanel({
  zoneId,
  gateId,
  initialCode = "",
}: {
  zoneId: string;
  gateId: string;
  /** @deprecated Prefer page-level gate identity; kept optional for callers. */
  gateName?: string;
  /** @deprecated Prefer shell user identity; kept optional for callers. */
  guardName?: string;
  initialCode?: string;
}) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"neutral" | "good" | "danger">("neutral");
  const lastSeededCode = useRef("");

  const verify = useVerifyVisitor(zoneId, gateId);
  const admit = useAdmitVisitor(zoneId, gateId);
  const verifyAsync = verify.mutateAsync;
  const admitAsync = admit.mutateAsync;

  function clearResult() {
    setMessage("");
    setCode("");
    setMessageTone("neutral");
  }

  const check = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      setMessage("");
      try {
        const response = await verifyAsync(trimmed);
        if (!response.valid || !response.passId) {
          setMessageTone("danger");
          setMessage(
            response.result
              ? `Pass not valid (${response.result}).`
              : "This pass could not be verified.",
          );
          return;
        }
        await admitAsync({ passId: response.passId });
        setMessageTone("good");
        setMessage("Admission confirmed.");
        setCode("");
      } catch (error) {
        setMessageTone("danger");
        setMessage(userMessageForError(error, "This pass could not be verified."));
      }
    },
    [admitAsync, verifyAsync],
  );

  useEffect(() => {
    if (!initialCode || initialCode === lastSeededCode.current) {
      return;
    }
    lastSeededCode.current = initialCode;
    const display = initialCode.startsWith("pvz://") ? initialCode : initialCode.toUpperCase();
    setCode(display);
    void check(initialCode);
  }, [check, initialCode]);

  const showSuccess = messageTone === "good" && Boolean(message);
  const showFailure = messageTone === "danger" && Boolean(message);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-xl font-semibold tracking-tight">Check visitor pass</h2>
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void check(code);
          }}
        >
          <Field label="Visitor code">
            <Input
              className="min-h-14 text-center font-mono text-2xl font-semibold tracking-[0.3em] uppercase"
              value={code}
              onChange={(event) => {
                const next = event.target.value;
                setCode(next.startsWith("pvz://") ? next : next.toUpperCase());
              }}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
            />
          </Field>
          <Button
            type="submit"
            className="mt-3 w-full"
            size="lg"
            disabled={verify.isPending || admit.isPending}
          >
            <Icon icon={ShieldCheck} size={24} />
            {verify.isPending || admit.isPending ? "Checking…" : "Check code"}
          </Button>
        </form>
        <Button asChild variant="secondary" size="lg" className="mt-3 w-full">
          <Link href="/security/scan">
            <Icon icon={ScanLine} size={24} />
            Scan QR code
          </Link>
        </Button>
      </div>

      {showSuccess ? (
        <div className="space-y-3">
          <StatusPlane tone="good" title="Admitted" detail={message} icon={CheckCircle2} />
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={clearResult}
          >
            Next code
          </Button>
        </div>
      ) : null}

      {showFailure ? (
        <div className="space-y-3">
          <StatusPlane tone="danger" title="Not valid" detail={message} icon={XCircle} />
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={clearResult}
          >
            Next code
          </Button>
        </div>
      ) : null}

    </section>
  );
}

export function RecentGateEvents({ zoneId, gateId }: { zoneId: string; gateId: string }) {
  const query = useFetchGateEvents(zoneId, gateId);

  if (query.isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-32 w-full" />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold tracking-tight">Recent gate events</h2>
      {!query.data?.items.length ? (
        <div className="mt-3">
          <EmptyState
            title="No recent events"
            detail="Verified and admitted passes will appear here."
          />
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {query.data.items.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3 text-sm last:border-0"
            >
              <div>
                <p className="font-medium text-foreground">{event.summary}</p>
                <p className="text-muted-foreground">{formatDateTime(event.createdAt)}</p>
              </div>
              <Badge tone={resultTone(event.result)}>{event.result}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
