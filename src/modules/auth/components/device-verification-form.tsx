"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/app.store";
import {
  Button,
  Icon,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Label,
} from "@/ui";
import { userMessageForError } from "@/utils/error-messages";
import { useResendDeviceChallenge } from "../mutations/use-resend-device-challenge";
import { useVerifyDevice } from "../mutations/use-verify-device";
import { completeAuthenticatedSession } from "../utils/complete-authenticated-session";
import { PublicShell } from "./public-shell";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function parseResendAfter(value: string | null) {
  if (!value) {
    return 60;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 60;
  }
  return Math.floor(parsed);
}

export function DeviceVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setActiveZoneId = useAppStore((state) => state.setActiveZoneId);
  const verify = useVerifyDevice();
  const resend = useResendDeviceChallenge();

  const challengeId = searchParams.get("challenge");
  const maskedEmail = searchParams.get("email");
  const [secondsLeft, setSecondsLeft] = useState(() =>
    parseResendAfter(searchParams.get("resendAfter")),
  );
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  async function submit(nextCode = code) {
    setMessage(null);

    if (!challengeId) {
      setMessage({
        tone: "error",
        text: "This verification link is incomplete. Return to sign in.",
      });
      return;
    }

    const normalized = digitsOnly(nextCode);
    if (normalized.length !== 6) {
      setMessage({
        tone: "error",
        text: "Enter the six-digit code from your email.",
      });
      return;
    }

    try {
      const result = await verify.mutateAsync({
        challengeId,
        code: normalized,
      });
      const destination = await completeAuthenticatedSession({
        csrfToken: result.csrfToken,
        queryClient,
        setActiveZoneId,
        returnTo: searchParams.get("returnTo"),
      });
      router.replace(destination);
    } catch (error) {
      setMessage({
        tone: "error",
        text: userMessageForError(error, "Unable to verify this device. Try again."),
      });
    }
  }

  async function handleResend() {
    setMessage(null);

    if (!challengeId || secondsLeft > 0 || resend.isPending) {
      return;
    }

    try {
      const result = await resend.mutateAsync(challengeId);
      setCode("");
      setSecondsLeft(result.resendAfterSeconds);
      const params = new URLSearchParams(searchParams.toString());
      params.set("challenge", result.challengeId);
      params.set("resendAfter", String(result.resendAfterSeconds));
      if (result.maskedEmail) {
        params.set("email", result.maskedEmail);
      }
      router.replace(`/verify-device?${params.toString()}`);
      setMessage({ tone: "info", text: "A new code has been sent." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: userMessageForError(error, "Unable to resend a code right now. Try again."),
      });
    }
  }

  if (!challengeId) {
    return (
      <PublicShell
        title="Verification link incomplete"
        description="This page is missing a challenge. Sign in again to request a new device code."
      >
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </PublicShell>
    );
  }

  return (
    <PublicShell
      title="Verify this device"
      description="We don’t recognize this browser, so we sent a one-time code to your email."
    >
      {maskedEmail ? (
        <p className="mb-6 text-sm text-foreground">
          Code sent to <span className="font-medium">{maskedEmail}</span>
        </p>
      ) : null}

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        noValidate
      >
        <div className="space-y-3">
          <Label htmlFor="device-otp">Six-digit code</Label>
          <InputOTP
            id="device-otp"
            maxLength={6}
            value={code}
            onChange={(value) => setCode(digitsOnly(value))}
            onComplete={(value) => {
              void submit(value);
            }}
            autoFocus
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div aria-live="polite" className="min-h-5 text-center">
          {message ? (
            <p
              role={message.tone === "error" ? "alert" : undefined}
              className={`text-sm ${message.tone === "error" ? "text-destructive" : "text-foreground"}`}
            >
              {message.text}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={verify.isPending || resend.isPending || code.length !== 6}
        >
          <Icon icon={ShieldCheck} size={24} />
          {verify.isPending ? "Verifying…" : "Verify device"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={secondsLeft > 0 || resend.isPending || verify.isPending}
          onClick={() => {
            void handleResend();
          }}
        >
          {secondsLeft > 0
            ? `Resend code in ${secondsLeft}s`
            : resend.isPending
              ? "Sending…"
              : "Resend code"}
        </Button>

        <Link
          href="/login"
          className="flex min-h-11 w-full items-center justify-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </form>
    </PublicShell>
  );
}
