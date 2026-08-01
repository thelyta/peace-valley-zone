"use client";

import { CheckCircle2, ScanLine, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { TGateVerificationValid } from "@/types/gate";
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
  const [result, setResult] = useState<TGateVerificationValid | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"neutral" | "good" | "danger">("neutral");
  const [observedPartySize, setObservedPartySize] = useState("");
  const [partyDiffers, setPartyDiffers] = useState(false);
  const lastSeededCode = useRef("");

  const verify = useVerifyVisitor(zoneId, gateId);
  const admit = useAdmitVisitor(zoneId, gateId);
  const verifyAsync = verify.mutateAsync;

  function clearResult() {
    setMessage("");
    setResult(null);
    setCode("");
    setPartyDiffers(false);
    setObservedPartySize("");
    setMessageTone("neutral");
  }

  async function check(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    setMessage("");
    setResult(null);
    setPartyDiffers(false);
    setObservedPartySize("");
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
      setResult(response);
    } catch (error) {
      setMessageTone("danger");
      setMessage(userMessageForError(error, "This pass could not be verified."));
    }
  }

  useEffect(() => {
    if (!initialCode || initialCode === lastSeededCode.current) {
      return;
    }
    lastSeededCode.current = initialCode;
    const display = initialCode.startsWith("pvz://") ? initialCode : initialCode.toUpperCase();
    setCode(display);
    setMessage("");
    setResult(null);
    setPartyDiffers(false);
    setObservedPartySize("");
    let cancelled = false;
    void verifyAsync(initialCode)
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (!response.valid || !response.passId) {
          setMessageTone("danger");
          setMessage(
            response.result
              ? `Pass not valid (${response.result}).`
              : "This pass could not be verified.",
          );
          return;
        }
        setResult(response);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setMessageTone("danger");
        setMessage(userMessageForError(error, "This pass could not be verified."));
      });
    return () => {
      cancelled = true;
    };
  }, [initialCode, verifyAsync]);

  async function confirm() {
    if (!result?.passId || admit.isPending) {
      return;
    }
    setMessage("");
    let observed: number | undefined;
    if (partyDiffers) {
      const parsed = Number(observedPartySize);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setMessageTone("danger");
        setMessage("Enter the observed party size.");
        return;
      }
      observed = parsed;
    }
    try {
      await admit.mutateAsync({ passId: result.passId, observedPartySize: observed });
      setMessageTone("good");
      setMessage("Admission confirmed.");
      setResult(null);
      setCode("");
      setPartyDiffers(false);
      setObservedPartySize("");
    } catch (error) {
      setMessageTone("danger");
      if (error instanceof ApiError && (error.status === 409 || error.status === 410)) {
        setMessage(userMessageForError(error, "Admission not confirmed—try again."));
        setResult(null);
        return;
      }
      setMessage(userMessageForError(error, "Admission not confirmed—try again."));
    }
  }

  const showReview = Boolean(result?.passId);
  const showSuccess = messageTone === "good" && Boolean(message) && !showReview;
  const showFailure = messageTone === "danger" && Boolean(message) && !showReview;

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
          <Button type="submit" className="mt-3 w-full" size="lg" disabled={verify.isPending}>
            <Icon icon={ShieldCheck} size={24} />
            {verify.isPending ? "Checking…" : "Check code"}
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

      {showReview && result ? (
        <section aria-live="polite" className="space-y-3 pb-24">
          <StatusPlane
            tone="good"
            title="Valid pass"
            detail={`${result.visitorName} · ${result.partySize} ${result.partySize === 1 ? "person" : "people"}`}
            icon={UserCheck}
          />
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex justify-between gap-3">
              <h3 className="text-lg font-semibold">{result.visitorName}</h3>
              <Badge tone={result.status === "PENDING" ? "good" : "warning"}>{result.status}</Badge>
            </div>
            <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight">
              {result.partySize}{" "}
              <span className="text-lg font-semibold text-muted-foreground">
                {result.partySize === 1 ? "person" : "people"}
              </span>
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Invited by</dt>
                <dd className="font-medium">{result.inviterName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Address</dt>
                <dd className="font-medium">
                  {result.houseNumber} {result.streetName}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Expires</dt>
                <dd className="font-medium">{formatDateTime(result.expiresAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Result</dt>
                <dd className="font-medium">{result.result}</dd>
              </div>
            </dl>
            {result.note ? (
              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">
                {result.note}
              </p>
            ) : null}

            <label className="mt-4 flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={partyDiffers}
                onChange={(event) => setPartyDiffers(event.target.checked)}
              />
              Observed party size differs
            </label>
            {partyDiffers ? (
              <Field label="Observed party size">
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={observedPartySize}
                  onChange={(event) => setObservedPartySize(event.target.value)}
                />
              </Field>
            ) : null}
          </div>

          <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-card/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <Button
              type="button"
              variant="success"
              size="lg"
              className="w-full"
              disabled={admit.isPending}
              onClick={() => void confirm()}
            >
              <Icon icon={UserCheck} size={28} />
              {admit.isPending ? "Confirming…" : "Admit visitor"}
            </Button>
          </div>
        </section>
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
