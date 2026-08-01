"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError, NetworkError } from "@/lib/errors";
import { Button, Field, Input } from "@/ui";
import { userMessageForError } from "@/utils/error-messages";
import { useForgotPassword } from "../mutations/use-forgot-password";
import { PublicShell } from "./public-shell";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

type ForgotValues = z.infer<typeof forgotSchema>;

const SUCCESS_MESSAGE =
  "Check your email for reset instructions. If an account exists, a message will arrive shortly.";

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function submit(values: ForgotValues) {
    setErrorMessage("");

    try {
      await forgot.mutateAsync(values);
      setDone(true);
    } catch (error) {
      if (error instanceof NetworkError) {
        setErrorMessage(userMessageForError(error, SUCCESS_MESSAGE));
        return;
      }
      if (error instanceof ApiError && error.code === "RATE_LIMITED") {
        setErrorMessage(
          userMessageForError(error, "Too many attempts. Please wait and try again."),
        );
        return;
      }
      // Same success copy for other outcomes so email existence is not leaked.
      setDone(true);
    }
  }

  return (
    <PublicShell
      title="Reset your password"
      description="We’ll email a link if an account exists for that address."
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
            {errorMessage ? (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={forgot.isPending}>
            {forgot.isPending ? "Sending…" : "Send reset link"}
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
