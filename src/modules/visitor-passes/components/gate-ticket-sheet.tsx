"use client";

import { Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import type { TCreatedVisitorPass } from "@/types/visitor-passes";
import { Button, Dialog, Icon } from "@/ui";
import { formatDateTime } from "@/utils/dates";

export type ShareableVisitorPass = TCreatedVisitorPass & { code: string; qrPayload: string };

export function GateTicketSheet({
  pass,
  open,
  onClose,
}: {
  pass: ShareableVisitorPass;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const street = pass.destinationStreet?.name ?? pass.streetName;
  const gate = pass.destinationGate?.name ?? pass.gateName;
  const text = [
    "Peace Valley visitor pass",
    `Visitor: ${pass.visitorName}`,
    `For: ${pass.partySize} ${pass.partySize === 1 ? "person" : "people"}`,
    street && gate ? `Destination: ${street} via ${gate}` : street ? `Street: ${street}` : null,
    `Code: ${pass.code}`,
    `Expires: ${formatDateTime(pass.expiresAt)}`,
    "This code works once. Please show it at the gate.",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(pass.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Some in-app and HTTP browsers deny Clipboard API access. The visible
      // code remains selectable, so do not turn this into an unhandled rejection.
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} title="Your visitor pass" onClose={onClose} className="sm:max-w-md">
      <div className="space-y-5">
        <p
          className="rounded-lg bg-warning-soft px-3 py-2 text-sm font-medium text-warning-soft-foreground"
          role="status"
        >
          Keep this code private. You can open it again from Recent visitor passes while it is
          pending.
        </p>

        <div className="rounded-xl bg-success-soft p-5 text-center">
          <p className="text-sm font-medium text-success-soft-foreground">One-time gate code</p>
          <p className="mt-3 font-mono text-4xl font-bold tracking-[0.2em] text-foreground sm:text-5xl">
            {pass.code}
          </p>
        </div>

        <div className="flex justify-center rounded-xl border border-border bg-card p-4">
          <QRCodeSVG value={pass.qrPayload} size={200} includeMargin />
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Visitor</dt>
            <dd className="font-medium text-foreground">{pass.visitorName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">People</dt>
            <dd className="font-medium text-foreground">{pass.partySize}</dd>
          </div>
          {street ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Street</dt>
              <dd className="font-medium text-foreground">{street}</dd>
            </div>
          ) : null}
          {gate ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Gate</dt>
              <dd className="font-medium text-foreground">{gate}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Expires</dt>
            <dd className="font-medium text-foreground">{formatDateTime(pass.expiresAt)}</dd>
          </div>
        </dl>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" size="lg" onClick={() => void copyCode()}>
            <Icon icon={copied ? Check : Copy} size={24} />
            {copied ? "Copied" : "Copy code"}
          </Button>
          <Button asChild variant="secondary" size="lg">
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </Button>
        </div>
        {canShare ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              void navigator.share({ text }).catch(() => undefined);
            }}
          >
            Share…
          </Button>
        ) : null}
        <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
}
