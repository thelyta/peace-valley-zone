"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError, NetworkError } from "@/lib/errors";
import { Button, Field, Input } from "@/ui";
import { useRequestActivationInvite } from "../mutations/use-request-activation-invite";
import { PublicShell } from "./public-shell";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
});
type Values = z.infer<typeof schema>;

const SUCCESS_MESSAGE =
  "If this account is awaiting activation, a new invitation will arrive shortly.";

export function RequestActivationInviteForm() {
  const requestInvite = useRequestActivationInvite();
  const [done, setDone] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function submit(values: Values) {
    form.clearErrors("root");
    try {
      await requestInvite.mutateAsync({ email: values.email });
      setDone(true);
    } catch (error) {
      if (error instanceof NetworkError) {
        form.setError("root", { type: "network", message: error.message });
        return;
      }
      if (error instanceof ApiError && error.code === "RATE_LIMITED") {
        const wait = error.retryAfter ? ` Try again in ${error.retryAfter} seconds.` : "";
        form.setError("root", {
          type: error.code,
          message: `Too many activation-email requests.${wait || " Please wait and try again."}`,
        });
        return;
      }
      form.setError("root", {
        type: error instanceof ApiError ? (error.code ?? "server") : "server",
        message: "Unable to request an activation email. Please try again.",
      });
    }
  }

  return (
    <PublicShell
      title="Request an activation email"
      description="We’ll send a new activation link if your account is waiting to be activated."
    >
      {done ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{SUCCESS_MESSAGE}</p>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={form.handleSubmit(submit)} noValidate>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              inputMode="email"
              {...form.register("email")}
            />
          </Field>
          <div aria-live="polite" className="min-h-5">
            {form.formState.errors.root?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={requestInvite.isPending}>
            {requestInvite.isPending ? "Sending…" : "Send activation email"}
          </Button>
          <Link
            href="/login"
            className="flex min-h-11 w-full items-center justify-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </form>
      )}
    </PublicShell>
  );
}
