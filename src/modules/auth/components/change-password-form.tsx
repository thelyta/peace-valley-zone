"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Field } from "@/ui";
import { useChangePassword } from "../mutations/use-change-password";
import { PasswordInput } from "./password-input";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: z.string().min(15, "Use at least 15 characters."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type Values = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const form = useForm<Values>({ resolver: zodResolver(schema) });
  const changePassword = useChangePassword();

  return (
    <form
      className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-5"
      onSubmit={form.handleSubmit(({ currentPassword, password }) =>
        changePassword.mutate({ currentPassword, password }, { onSuccess: () => form.reset() }),
      )}
    >
      <div>
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Other signed-in devices will be signed out after you save.
        </p>
      </div>
      <Field label="Current password" error={form.formState.errors.currentPassword?.message}>
        <PasswordInput autoComplete="current-password" {...form.register("currentPassword")} />
      </Field>
      <Field label="New password" error={form.formState.errors.password?.message}>
        <PasswordInput autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field label="Confirm new password" error={form.formState.errors.confirmPassword?.message}>
        <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
      </Field>
      {changePassword.isSuccess ? (
        <p className="text-sm text-success-soft-foreground">Password updated.</p>
      ) : null}
      <Button type="submit" disabled={changePassword.isPending}>
        {changePassword.isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
