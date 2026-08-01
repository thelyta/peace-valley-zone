"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Ticket, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  ErrorState,
  Field,
  Icon,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
} from "@/ui";
import { eligibilityExplanation } from "@/utils/error-messages";
import { normalizeNigerianPhone } from "@/utils/phone";
import { useCreateVisitorPass } from "../mutations/use-create-visitor-pass";
import { useFetchEntryGates } from "../queries/use-fetch-entry-gates";
import { useFetchVisitorEligibility } from "../queries/use-fetch-visitor-eligibility";
import { GateTicketSheet, type ShareableVisitorPass } from "./gate-ticket-sheet";

const inviteSchema = z.object({
  visitorName: z.string().trim().min(1, "Enter the visitor’s name."),
  visitorPhone: z.string().optional(),
  partySize: z.number().int().min(1, "Party size must be at least 1."),
  note: z.string().optional(),
  gateId: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

function defaultGateId(items: { id: string; isDefault: boolean }[]) {
  if (items.length === 1) {
    return items[0]?.id ?? "";
  }
  return items.find((item) => item.isDefault)?.id ?? "";
}

export function VisitorInvite({ zoneId, householdId }: { zoneId: string; householdId: string }) {
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const [created, setCreated] = useState<ShareableVisitorPass | null>(null);
  const [replayNotice, setReplayNotice] = useState("");

  const eligibilityQuery = useFetchVisitorEligibility(zoneId, householdId);
  const gatesQuery = useFetchEntryGates(zoneId, householdId);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      visitorName: "",
      visitorPhone: "",
      partySize: 1,
      note: "",
      gateId: "",
    },
  });

  const gates = gatesQuery.data?.items ?? [];
  const streetName = gatesQuery.data?.street.name;
  const multipleGates = gates.length > 1;

  useEffect(() => {
    if (!gates.length) {
      return;
    }
    const current = form.getValues("gateId");
    if (!current || !gates.some((gate) => gate.id === current)) {
      form.setValue("gateId", defaultGateId(gates));
    }
  }, [form, gates]);

  const create = useCreateVisitorPass(zoneId, householdId);

  function submitCreate(values: InviteFormValues) {
    const phone = values.visitorPhone?.trim();
    return create.mutateAsync({
      body: {
        visitorName: values.visitorName.trim(),
        partySize: values.partySize,
        gateId: values.gateId || undefined,
        visitNote: values.note?.trim() || undefined,
        visitorPhoneE164: phone ? normalizeNigerianPhone(phone) : undefined,
      },
      idempotencyKey: idempotencyKeyRef.current,
    });
  }

  const eligibility = eligibilityQuery.data;
  const canCreate = eligibility?.allowed === true;

  async function submit(values: InviteFormValues) {
    setReplayNotice("");
    try {
      const result = await submitCreate(values);
      const code = result.code ?? result.humanCode;
      if (!code || !result.qrPayload) {
        setCreated(null);
        setReplayNotice(
          "This invitation was already created, but the full code is no longer available. Open it from Recent visitor passes if it is still pending, or cancel and create a new one.",
        );
        idempotencyKeyRef.current = crypto.randomUUID();
        form.reset({
          visitorName: "",
          visitorPhone: "",
          partySize: 1,
          note: "",
          gateId: defaultGateId(gates),
        });
        return;
      }
      setCreated({ ...result, code, qrPayload: result.qrPayload });
      form.reset({
        visitorName: "",
        visitorPhone: "",
        partySize: 1,
        note: "",
        gateId: defaultGateId(gates),
      });
      idempotencyKeyRef.current = crypto.randomUUID();
    } catch {
      // Error toast comes from mutation onError (handleApiError).
    }
  }

  if (eligibilityQuery.isLoading || gatesQuery.isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-40 w-full" />
      </section>
    );
  }

  if (eligibilityQuery.isError || gatesQuery.isError) {
    return (
      <ErrorState
        error="We could not load invitation details."
        retry={() => {
          void eligibilityQuery.refetch();
          void gatesQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon icon={UserPlus} size={28} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Invite a visitor</h2>
          {streetName && canCreate ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{streetName}</p>
          ) : null}
        </div>
      </div>

      {eligibility && !eligibility.allowed ? (
        <p
          className="mt-4 rounded-lg bg-warning-soft p-3 text-sm text-warning-soft-foreground"
          role="status"
        >
          {eligibilityExplanation(eligibility.reason)}
        </p>
      ) : null}

      {created ? <GateTicketSheet pass={created} open onClose={() => setCreated(null)} /> : null}

      {replayNotice ? (
        <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-foreground" role="status">
          {replayNotice}
        </p>
      ) : null}

      {canCreate ? (
        <form onSubmit={form.handleSubmit(submit)} className="mt-5 space-y-4">
          {multipleGates ? (
            <div className="space-y-1.5">
              <Label htmlFor="entry-gate">Entry gate</Label>
              <Controller
                control={form.control}
                name="gateId"
                rules={{ required: "Choose an entry gate." }}
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="entry-gate"
                      aria-invalid={Boolean(form.formState.errors.gateId)}
                    >
                      <SelectValue placeholder="Select a gate" />
                    </SelectTrigger>
                    <SelectContent>
                      {gates.map((gate) => (
                        <SelectItem key={gate.id} value={gate.id}>
                          {gate.name}
                          {gate.description ? ` — ${gate.description}` : ""}
                          {gate.isDefault ? " (default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.gateId?.message ? (
                <span className="block text-sm text-destructive">
                  {form.formState.errors.gateId.message}
                </span>
              ) : (
                <span className="block text-sm text-muted-foreground">
                  Choose the gate your visitor should use.
                </span>
              )}
            </div>
          ) : gates[0] ? (
            <p className="text-sm text-muted-foreground">
              Entry gate: <span className="font-medium text-foreground">{gates[0].name}</span>
            </p>
          ) : (
            <p className="rounded-lg bg-warning-soft p-3 text-sm text-warning-soft-foreground">
              No entry gate is configured for this street. Contact estate management.
            </p>
          )}

          <Field label="Visitor name" error={form.formState.errors.visitorName?.message}>
            <Input autoComplete="name" {...form.register("visitorName")} />
          </Field>
          <Field label="Phone (optional)" hint="Nigerian numbers are normalized automatically.">
            <Input type="tel" autoComplete="tel" {...form.register("visitorPhone")} />
          </Field>
          <Field label="Number of people" error={form.formState.errors.partySize?.message}>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              {...form.register("partySize", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Note (optional)">
            <Textarea rows={2} {...form.register("note")} />
          </Field>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={create.isPending || gates.length === 0}
          >
            <Icon icon={Ticket} size={24} />
            {create.isPending ? "Creating pass…" : "Create visitor pass"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
