"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Field, Icon, Input, Textarea, useToast } from "@/ui";
import { useRequestHouseholdMember } from "../mutations/use-request-household-member";

const requestSchema = z.object({
  fullName: z.string().trim().min(1, "Enter the member's name."),
  email: z.string().trim().email("Enter a valid email address."),
  phoneE164: z.string().trim().optional(),
  relationship: z.string().trim().min(1, "Enter the relationship."),
  notes: z.string().trim().optional(),
});

type RequestValues = z.infer<typeof requestSchema>;

export function RequestHouseholdMemberForm({
  zoneId,
  householdId,
}: {
  zoneId: string;
  householdId: string;
}) {
  const toast = useToast();
  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneE164: "",
      relationship: "",
      notes: "",
    },
  });
  const request = useRequestHouseholdMember(zoneId, householdId);

  function onSubmit(values: RequestValues) {
    const phone = values.phoneE164?.trim();
    const notes = values.notes?.trim();
    request.mutate(
      {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        relationship: values.relationship.trim(),
        ...(phone ? { phoneE164: phone } : {}),
        ...(notes ? { notes } : {}),
      },
      {
        onSuccess: () => {
          toast("Member request sent to zone admins.");
          form.reset();
        },
      },
    );
  }

  return (
    <form
      className="space-y-3 rounded-xl border border-border bg-card p-5"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Request a household member</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Zone admins will review the request before the member is added.
        </p>
      </div>
      <Field label="Full name" error={form.formState.errors.fullName?.message}>
        <Input autoComplete="name" {...form.register("fullName")} />
      </Field>
      <Field label="Email address" error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Phone number" error={form.formState.errors.phoneE164?.message}>
        <Input
          type="tel"
          autoComplete="tel"
          placeholder="Optional"
          {...form.register("phoneE164")}
        />
      </Field>
      <Field label="Relationship" error={form.formState.errors.relationship?.message}>
        <Input placeholder="e.g. Spouse, Child, Tenant" {...form.register("relationship")} />
      </Field>
      <Field label="Additional notes" error={form.formState.errors.notes?.message}>
        <Textarea rows={3} placeholder="Optional" {...form.register("notes")} />
      </Field>
      <Button type="submit" disabled={request.isPending}>
        <Icon icon={UserPlus} size={20} />
        {request.isPending ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
