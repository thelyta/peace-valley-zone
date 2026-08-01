"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Field } from "@/ui";
import { userMessageForError } from "@/utils/error-messages";
import { useActivateAccount } from "../mutations/use-activate-account";
import { useResetPassword } from "../mutations/use-reset-password";
import { PasswordInput } from "./password-input";
import { PublicShell } from "./public-shell";

const passwordSchema = z
  .object({
    password: z.string().min(15, "Use at least 15 characters."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export function PasswordForm({ mode }: { mode: "activate" | "reset" }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const activate = useActivateAccount();
  const reset = useResetPassword();
  const pending = activate.isPending || reset.isPending;

  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function submit(values: PasswordValues) {
    setErrorMessage("");

    if (!token) {
      setErrorMessage(
        mode === "activate"
          ? "This activation link is incomplete. Request a new invitation."
          : "This reset link is incomplete. Request a new password reset email.",
      );
      return;
    }

    try {
      if (mode === "activate") {
        await activate.mutateAsync({ token, password: values.password });
      } else {
        await reset.mutateAsync({ token, password: values.password });
      }
      setSuccess(true);
    } catch (error) {
      setErrorMessage(
        userMessageForError(
          error,
          mode === "activate"
            ? "Unable to activate this account. Try again or request a new invitation."
            : "Unable to reset your password. Try again or request a new reset email.",
        ),
      );
    }
  }

  const title = mode === "activate" ? "Activate your account" : "Choose a new password";
  const description =
    mode === "activate"
      ? "Set a password to finish joining Peace Valley Zone."
      : "Use a long password or memorable phrase — at least 15 characters.";

  if (success) {
    return (
      <PublicShell title={title} description={description}>
        <div className="space-y-4">
          {mode === "reset" ? (
            <p className="text-sm text-muted-foreground">
              Your password was updated and all other devices were signed out. Sign in with your new
              password.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your account is ready. Sign in with your new password to continue.
            </p>
          )}
          <Button asChild className="w-full" size="lg">
            <Link href="/login">Continue to sign in</Link>
          </Button>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell title={title} description={description}>
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)} noValidate>
        <Field
          label="Password"
          hint="A memorable phrase works well."
          error={form.formState.errors.password?.message}
        >
          <PasswordInput autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Field label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
        </Field>
        <div aria-live="polite" className="min-h-5">
          {errorMessage ? (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Continue"}
        </Button>
      </form>
    </PublicShell>
  );
}
