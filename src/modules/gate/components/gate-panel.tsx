"use client";

import { CheckCircle2, ScanLine, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VerifyVisitorResponseDtoOutput } from "@/api/generated/estatelyAPI.schemas";
import { cn } from "@/lib/utils";
import { useEstateTimezone } from "@/modules/zones";
import { Badge, Button, EmptyState, ErrorState, Field, Icon, Input, Skeleton } from "@/ui";
import { formatDateTime } from "@/utils/dates";
import { userMessageForError } from "@/utils/error-messages";
import { useAdmitVisitor } from "../mutations/use-admit-visitor";
import { useVerifyVisitor } from "../mutations/use-verify-visitor";
import { useFetchGateEvents } from "../queries/use-fetch-gate-events";
import { isCompleteManualVisitorCode } from "../utils/manual-code";
import { isQrPayload } from "../utils/scan";

export type { TGateEvent, TMyGate } from "@/types/gate";
export { myGatesQueryOptions, useFetchMyGates } from "../queries/use-fetch-my-gates";

function resultTone(result: string): "neutral" | "good" | "warning" | "danger" {
  switch (result) {
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
  const [messageTone, setMessageTone] = useState<"neutral" | "good" | "danger" | "warning">(
    "neutral",
  );
  const [review, setReview] = useState<{
    pass: Extract<VerifyVisitorResponseDtoOutput, { valid: true }>;
    proof: { method: "MANUAL"; code: string } | { method: "QR"; token: string };
  } | null>(null);
  const [observedPartySize, setObservedPartySize] = useState("");
  const timeZone = useEstateTimezone(zoneId);
  const lastSeededCode = useRef("");
  const lastCheckedCode = useRef("");

  const verify = useVerifyVisitor(zoneId, gateId);
  const admit = useAdmitVisitor(zoneId, gateId);
  const verifyAsync = verify.mutateAsync;
  const admitAsync = admit.mutateAsync;

  function clearResult() {
    setMessage("");
    setCode("");
    setMessageTone("neutral");
    setReview(null);
    setObservedPartySize("");
    lastCheckedCode.current = "";
  }

  const check = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      if (lastCheckedCode.current === trimmed) {
        return;
      }
      lastCheckedCode.current = trimmed;
      setMessage("");
      setReview(null);
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
        const proof = isQrPayload(trimmed)
          ? ({ method: "QR", token: trimmed } as const)
          : ({ method: "MANUAL", code: trimmed } as const);
        setReview({ pass: response, proof });
        setObservedPartySize(String(response.partySize));
        setMessageTone("neutral");
      } catch (error) {
        setMessageTone("danger");
        setMessage(userMessageForError(error, "This pass could not be verified."));
      }
    },
    [verifyAsync],
  );

  async function admitReviewedPass() {
    if (!review) return;
    const parsedPartySize = Number(observedPartySize);
    if (!Number.isInteger(parsedPartySize) || parsedPartySize < 1) {
      setMessageTone("danger");
      setMessage("Enter the number of visitors actually present.");
      return;
    }
    setMessage("");
    try {
      await admitAsync({
        passId: review.pass.passId,
        proof: review.proof,
        observedPartySize: parsedPartySize,
      });
      setReview(null);
      setMessageTone("good");
      setMessage("Admission confirmed.");
      setCode("");
      lastCheckedCode.current = "";
    } catch (error) {
      setMessageTone("warning");
      setMessage(
        userMessageForError(
          error,
          "Admission was not confirmed. Check recent events before trying again.",
        ),
      );
    }
  }

  useEffect(() => {
    if (!initialCode || initialCode === lastSeededCode.current) {
      return;
    }
    lastSeededCode.current = initialCode;
    const display = initialCode.startsWith("pvz://") ? initialCode : initialCode.toUpperCase();
    setCode(display);
    void check(initialCode);
  }, [check, initialCode]);

  useEffect(() => {
    if (
      review ||
      verify.isPending ||
      admit.isPending ||
      isQrPayload(code) ||
      !isCompleteManualVisitorCode(code)
    ) {
      return;
    }
    void check(code);
  }, [admit.isPending, check, code, review, verify.isPending]);

  const showSuccess = messageTone === "good" && Boolean(message);
  const showFailure = (messageTone === "danger" || messageTone === "warning") && Boolean(message);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-xl font-semibold tracking-tight">Check visitor pass</h2>
        <div className="mt-4">
          <Field label="Visitor code">
            <Input
              className="min-h-14 text-center font-mono text-2xl font-semibold tracking-[0.3em] uppercase"
              value={code}
              onChange={(event) => {
                const next = event.target.value;
                setCode(next.startsWith("pvz://") ? next : next.toUpperCase());
                setMessage("");
                setMessageTone("neutral");
                lastCheckedCode.current = "";
              }}
              disabled={verify.isPending || admit.isPending || Boolean(review)}
              aria-describedby="visitor-code-help"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
            />
          </Field>
          <p
            id="visitor-code-help"
            className="mt-2 text-center text-sm text-muted-foreground"
            aria-live="polite"
          >
            {verify.isPending
              ? "Checking code…"
              : "Verification starts automatically after all 6 characters are entered."}
          </p>
        </div>
        <Button asChild variant="secondary" size="lg" className="mt-3 w-full">
          <Link href="/security/scan">
            <Icon icon={ScanLine} size={24} />
            Scan QR code
          </Link>
        </Button>
      </div>

      {review ? (
        <div className="space-y-4 rounded-xl border border-primary/25 bg-card p-5">
          <div>
            <Badge tone="good">Valid pass</Badge>
            <h3 className="mt-2 text-xl font-semibold">{review.pass.visitorName}</h3>
            <p className="text-sm text-muted-foreground">
              Invited by {review.pass.inviterName} · {review.pass.houseNumber}
              {review.pass.streetName ? ` ${review.pass.streetName}` : ""}
            </p>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Invited party size</dt>
              <dd className="font-medium">{review.pass.partySize}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Expires</dt>
              <dd className="font-medium">{formatDateTime(review.pass.expiresAt, timeZone)}</dd>
            </div>
            {review.pass.note ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Visit note</dt>
                <dd className="font-medium">{review.pass.note}</dd>
              </div>
            ) : null}
          </dl>
          <Field label="Visitors present">
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={observedPartySize}
              onChange={(event) => setObservedPartySize(event.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearResult}
              disabled={admit.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void admitReviewedPass()}
              disabled={admit.isPending}
            >
              <Icon icon={ShieldCheck} size={20} />
              {admit.isPending ? "Admitting…" : "Admit visitor"}
            </Button>
          </div>
        </div>
      ) : null}

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
          <StatusPlane
            tone={messageTone === "warning" ? "warning" : "danger"}
            title={messageTone === "warning" ? "Not confirmed" : "Not valid"}
            detail={message}
            icon={XCircle}
          />
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
  const timeZone = useEstateTimezone(zoneId);

  if (query.isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-32 w-full" />
      </section>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        error={userMessageForError(query.error, "Recent gate events could not be loaded.")}
        retry={() => void query.refetch()}
      />
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold tracking-tight">Recent gate events</h2>
      {!query.data?.items.length ? (
        <div className="mt-3">
          <EmptyState
            title="No recent events"
            detail="Admissions and unsuccessful pass checks will appear here."
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
                <p className="text-muted-foreground">{formatDateTime(event.createdAt, timeZone)}</p>
              </div>
              <Badge tone={resultTone(event.result)}>{event.result}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
