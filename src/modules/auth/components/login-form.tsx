"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAppStore } from "@/lib/app.store";
import { ApiError, NetworkError } from "@/lib/errors";
import { Button, Field, Icon, Input } from "@/ui";
import { userMessageForError } from "@/utils/error-messages";
import { useLogin } from "../mutations/use-login";
import { completeAuthenticatedSession } from "../utils/complete-authenticated-session";
import { PasswordInput } from "./password-input";
import { PublicShell } from "./public-shell";

const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

type CredentialsValues = z.infer<typeof credentialsSchema>;

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

function loginErrorMessage(error: unknown) {
  if (error instanceof NetworkError) {
    return userMessageForError(error, INVALID_CREDENTIALS_MESSAGE);
  }

  if (error instanceof ApiError) {
    if (
      error.code === "ACCOUNT_INACTIVE" ||
      error.code === "ACCOUNT_NOT_ACTIVATED" ||
      error.code === "RATE_LIMITED"
    ) {
      return userMessageForError(error, INVALID_CREDENTIALS_MESSAGE);
    }
    if (error.code === "INVALID_CREDENTIALS" || error.status === 401) {
      return INVALID_CREDENTIALS_MESSAGE;
    }
    return userMessageForError(error, INVALID_CREDENTIALS_MESSAGE);
  }

  return INVALID_CREDENTIALS_MESSAGE;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setActiveZoneId = useAppStore((state) => state.setActiveZoneId);
  const login = useLogin();
  const form = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function submit(values: CredentialsValues) {
    form.clearErrors("root");

    try {
      const result = await login.mutateAsync(values);

      if (result.status === "DEVICE_VERIFICATION_REQUIRED") {
        const params = new URLSearchParams({
          challenge: result.challengeId,
          resendAfter: String(result.resendAfterSeconds),
        });
        if (result.maskedEmail) {
          params.set("email", result.maskedEmail);
        }
        const returnTo = searchParams.get("returnTo");
        if (returnTo) {
          params.set("returnTo", returnTo);
        }
        window.location.assign(`/verify-device?${params.toString()}`);
        return;
      }

      const destination = await completeAuthenticatedSession({
        csrfToken: result.csrfToken,
        queryClient,
        setActiveZoneId,
        returnTo: searchParams.get("returnTo"),
      });
      router.replace(destination);
    } catch (error) {
      form.setError("root", {
        type: error instanceof ApiError ? (error.code ?? "server") : "server",
        message: loginErrorMessage(error),
      });
    }
  }

  return (
    <PublicShell
      title="Sign in"
      description="Residents, gate staff, and estate admins use the same sign-in."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)} noValidate>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" inputMode="email" {...form.register("email")} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...form.register("password")} />
        </Field>
        <div aria-live="polite" className="min-h-5">
          {form.formState.errors.root ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          ) : null}
        </div>
        {form.formState.errors.root?.type === "ACCOUNT_NOT_ACTIVATED" ? (
          <Link
            className="flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-primary hover:bg-muted"
            href="/request-activation"
          >
            Send a new activation email
          </Link>
        ) : null}
        <Button type="submit" className="w-full" size="lg" disabled={login.isPending}>
          <Icon icon={LogIn} size={24} />
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
        <Link
          className="flex min-h-11 items-center justify-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </form>
    </PublicShell>
  );
}
