"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { TDuesPeriod, THouseholdDuesItem } from "@/types/dues";
import type { DuesPeriodStatus, HouseholdDuesStatus, VisitorAccessOverride } from "@/types/enums";
import {
  Badge,
  Button,
  ConfirmDialog,
  DatePicker,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  Input,
  SelectControl,
  Skeleton,
  useToast,
} from "@/ui";
import { formatKobo, nairaToKobo } from "@/utils/money";
import { useAssessHouseholds } from "../mutations/use-assess-households";
import { useCreateDuesPeriod } from "../mutations/use-create-dues-period";
import { useRecordDuesPayment } from "../mutations/use-record-dues-payment";
import { useUpdateDuesPeriod } from "../mutations/use-update-dues-period";
import { useUpdateHouseholdDues } from "../mutations/use-update-household-dues";
import { useFetchDuesPeriods } from "../queries/use-fetch-dues-periods";
import { useFetchHouseholdDues } from "../queries/use-fetch-household-dues";

function periodTone(status: DuesPeriodStatus) {
  switch (status) {
    case "OPEN":
      return "good" as const;
    case "DRAFT":
      return "warning" as const;
    case "CLOSED":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function duesTone(status: HouseholdDuesStatus) {
  switch (status) {
    case "PAID":
    case "WAIVED":
      return "good" as const;
    case "PARTIAL":
      return "warning" as const;
    case "UNPAID":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function DuesAdmin({ zoneId }: { zoneId: string }) {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dues</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Billing periods, assessments, payments, and waivers.
        </p>
      </div>
      <DuesPeriodsPanel zoneId={zoneId} />
      <HouseholdDuesPanel zoneId={zoneId} />
    </section>
  );
}

const periodSchema = z.object({
  name: z.string().trim().min(1, "Enter a period name."),
  periodKey: z.string().trim().min(1, "Enter a period key."),
  amountNaira: z.number().positive("Enter an amount greater than zero."),
  startsOn: z.string().min(1, "Choose a start date."),
  dueOn: z.string().optional(),
});

type PeriodValues = z.infer<typeof periodSchema>;

function DuesPeriodsPanel({ zoneId }: { zoneId: string }) {
  const toast = useToast();
  const query = useFetchDuesPeriods(zoneId);
  const [statusTarget, setStatusTarget] = useState<{
    period: TDuesPeriod;
    status: DuesPeriodStatus;
  } | null>(null);
  const [assessTarget, setAssessTarget] = useState<TDuesPeriod | null>(null);
  const form = useForm<PeriodValues>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      name: "",
      periodKey: "",
      amountNaira: 0,
      startsOn: "",
      dueOn: "",
    },
  });

  const create = useCreateDuesPeriod(zoneId);

  function submitCreate(values: PeriodValues) {
    create.mutate(
      {
        name: values.name.trim(),
        periodKey: values.periodKey.trim(),
        amountDueKobo: nairaToKobo(values.amountNaira),
        startsOn: values.startsOn,
        dueOn: values.dueOn || undefined,
      },
      {
        onSuccess: () => {
          toast("Dues period created.");
          form.reset();
        },
      },
    );
  }

  const patchStatus = useUpdateDuesPeriod(zoneId);

  function confirmPatchStatus() {
    if (!statusTarget) {
      return;
    }
    patchStatus.mutate(
      { periodId: statusTarget.period.id, body: { status: statusTarget.status } },
      {
        onSuccess: () => {
          toast("Period status updated.");
          setStatusTarget(null);
        },
      },
    );
  }

  const assess = useAssessHouseholds(zoneId);

  function confirmAssess() {
    if (!assessTarget) {
      return;
    }
    assess.mutate(assessTarget.id, {
      onSuccess: (result) => {
        toast(`Assessed ${result.assessed} households.`);
        setAssessTarget(null);
      },
    });
  }

  if (query.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (query.isError) {
    return <ErrorState error="Unable to load dues periods." retry={() => void query.refetch()} />;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Periods</h2>
      <form
        className="space-y-3 rounded-xl border border-border bg-card p-4"
        onSubmit={form.handleSubmit(submitCreate)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="2026 Annual Dues" />
          </Field>
          <Field label="Period key" error={form.formState.errors.periodKey?.message}>
            <Input {...form.register("periodKey")} placeholder="One Year" />
          </Field>
          <Field label="Amount (₦)" error={form.formState.errors.amountNaira?.message}>
            <Input
              type="number"
              min={0}
              step="0.01"
              {...form.register("amountNaira", { valueAsNumber: true })}
            />
          </Field>
          <Controller
            control={form.control}
            name="startsOn"
            render={({ field, fieldState }) => (
              <Field label="Starts on" error={fieldState.error?.message}>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  placeholder="Start date"
                />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="dueOn"
            render={({ field }) => (
              <Field label="Due on (optional)">
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  placeholder="Due date"
                  clearable
                />
              </Field>
            )}
          />
        </div>
        <Button type="submit" disabled={create.isPending}>
          <Icon icon={Wallet} size={24} />
          {create.isPending ? "Creating…" : "Create period"}
        </Button>
      </form>

      {!query.data.items.length ? (
        <EmptyState title="No dues periods" detail="Create a period to begin assessments." />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {query.data.items.map((period) => (
              <PeriodCard
                key={period.id}
                period={period}
                onStatus={(status) => setStatusTarget({ period, status })}
                onAssess={() => setAssessTarget(period)}
              />
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Key</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((period) => (
                  <tr className="border-t border-border" key={period.id}>
                    <td className="px-4 py-3 font-medium">{period.name}</td>
                    <td className="px-4 py-3">{period.periodKey}</td>
                    <td className="px-4 py-3">{formatKobo(period.amountDueKobo)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={periodTone(period.status)}>{period.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <PeriodActions
                        period={period}
                        onStatus={(status) => setStatusTarget({ period, status })}
                        onAssess={() => setAssessTarget(period)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title="Update period status"
        detail={
          statusTarget ? `${statusTarget.period.name} will become ${statusTarget.status}.` : ""
        }
        confirmLabel="Update status"
        pending={patchStatus.isPending}
        onClose={() => setStatusTarget(null)}
        onConfirm={confirmPatchStatus}
      />
      <ConfirmDialog
        open={Boolean(assessTarget)}
        title="Assess households"
        detail={
          assessTarget
            ? `Create dues rows for all active households in ${assessTarget.name}. Existing rows are skipped.`
            : ""
        }
        confirmLabel="Assess households"
        pending={assess.isPending}
        tone="primary"
        onClose={() => setAssessTarget(null)}
        onConfirm={confirmAssess}
      />
    </section>
  );
}

function PeriodCard({
  period,
  onStatus,
  onAssess,
}: {
  period: TDuesPeriod;
  onStatus: (status: DuesPeriodStatus) => void;
  onAssess: () => void;
}) {
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <p className="font-medium">{period.name}</p>
      <p className="text-sm text-muted-foreground">
        {period.periodKey} · {formatKobo(period.amountDueKobo)}
      </p>
      <div className="mt-2">
        <Badge tone={periodTone(period.status)}>{period.status}</Badge>
      </div>
      <div className="mt-3">
        <PeriodActions period={period} onStatus={onStatus} onAssess={onAssess} />
      </div>
    </li>
  );
}

function PeriodActions({
  period,
  onStatus,
  onAssess,
}: {
  period: TDuesPeriod;
  onStatus: (status: DuesPeriodStatus) => void;
  onAssess: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {period.status === "DRAFT" && (
        <Button variant="secondary" onClick={() => onStatus("OPEN")}>
          Open
        </Button>
      )}
      {period.status === "OPEN" && (
        <Button variant="secondary" onClick={() => onStatus("CLOSED")}>
          Close
        </Button>
      )}
      {period.status !== "CLOSED" && (
        <Button variant="secondary" onClick={onAssess}>
          Assess households
        </Button>
      )}
    </div>
  );
}

function visitationPolicyLabel(value: VisitorAccessOverride | string) {
  switch (value) {
    case "ALLOW":
      return "Allow visitation";
    case "BLOCK":
      return "Block visitation";
    default:
      return "Follow zone policy";
  }
}

function HouseholdDuesPanel({ zoneId }: { zoneId: string }) {
  const query = useFetchHouseholdDues(zoneId);
  const [paymentTarget, setPaymentTarget] = useState<THouseholdDuesItem | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    item: THouseholdDuesItem;
    body: {
      status?: HouseholdDuesStatus;
      visitorEligibilityOverride?: VisitorAccessOverride;
    };
    label: string;
  } | null>(null);
  const toast = useToast();

  const patch = useUpdateHouseholdDues(zoneId);

  function confirmPatch() {
    if (!confirmTarget) {
      return;
    }
    patch.mutate(
      { duesId: confirmTarget.item.id, body: confirmTarget.body },
      {
        onSuccess: () => {
          toast("Household dues updated.");
          setConfirmTarget(null);
        },
      },
    );
  }

  if (query.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (query.isError) {
    return <ErrorState error="Unable to load household dues." retry={() => void query.refetch()} />;
  }

  const items = query.data.items;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Household dues</h2>
      {!items.length ? (
        <EmptyState
          title="No household dues"
          detail="Open a period and assess households to generate rows."
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">
                  {item.household} {item.street}
                </p>
                <p className="text-sm text-muted-foreground">{item.period}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={duesTone(item.status)}>{item.status}</Badge>
                  <Badge>{visitationPolicyLabel(item.visitorEligibilityOverride)}</Badge>
                </div>
                <p className="mt-2 text-sm">
                  Due {formatKobo(item.amountDueKobo)} · Paid {formatKobo(item.amountPaidKobo)}
                </p>
                <DuesRowActions
                  item={item}
                  onPay={() => setPaymentTarget(item)}
                  onConfirm={(body, label) => setConfirmTarget({ item, body, label })}
                />
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Household</th>
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Amounts</th>
                  <th className="px-4 py-3 font-semibold">Visitation policy</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-t border-border" key={item.id}>
                    <td className="px-4 py-3">
                      {item.household} {item.street}
                    </td>
                    <td className="px-4 py-3">{item.period}</td>
                    <td className="px-4 py-3">
                      <Badge tone={duesTone(item.status)}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      Due {formatKobo(item.amountDueKobo)}
                      <br />
                      Paid {formatKobo(item.amountPaidKobo)}
                    </td>
                    <td className="px-4 py-3">
                      {visitationPolicyLabel(item.visitorEligibilityOverride)}
                    </td>
                    <td className="px-4 py-3">
                      <DuesRowActions
                        item={item}
                        onPay={() => setPaymentTarget(item)}
                        onConfirm={(body, label) => setConfirmTarget({ item, body, label })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <RecordPaymentDialog
        zoneId={zoneId}
        item={paymentTarget}
        onClose={() => setPaymentTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.label ?? "Confirm update"}
        detail={
          confirmTarget
            ? `${confirmTarget.item.household} ${confirmTarget.item.street} (${confirmTarget.item.period}) will be updated.`
            : ""
        }
        confirmLabel="Confirm"
        pending={patch.isPending}
        tone={confirmTarget?.body.status === "WAIVED" ? "danger" : "primary"}
        onClose={() => setConfirmTarget(null)}
        onConfirm={confirmPatch}
      />
    </section>
  );
}

function DuesRowActions({
  item,
  onPay,
  onConfirm,
}: {
  item: THouseholdDuesItem;
  onPay: () => void;
  onConfirm: (
    body: {
      status?: HouseholdDuesStatus;
      visitorEligibilityOverride?: VisitorAccessOverride;
    },
    label: string,
  ) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
      {item.status !== "PAID" && item.status !== "WAIVED" && (
        <Button variant="secondary" onClick={onPay}>
          Record payment
        </Button>
      )}
      {item.status !== "WAIVED" && (
        <Button variant="secondary" onClick={() => onConfirm({ status: "WAIVED" }, "Waive dues")}>
          Waive
        </Button>
      )}
      <SelectControl
        className="max-w-[14rem]"
        value={item.visitorEligibilityOverride}
        onValueChange={(value) =>
          onConfirm(
            {
              visitorEligibilityOverride: value as VisitorAccessOverride,
            },
            "Update visitation policy for this household",
          )
        }
        options={[
          { value: "INHERIT", label: "Follow zone policy" },
          { value: "ALLOW", label: "Allow visitation" },
          { value: "BLOCK", label: "Block visitation" },
        ]}
      />
    </div>
  );
}

const paymentSchema = z.object({
  amountNaira: z.number().positive("Enter an amount greater than zero."),
  paymentReference: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type PaymentValues = z.infer<typeof paymentSchema>;

function RecordPaymentDialog({
  zoneId,
  item,
  onClose,
}: {
  zoneId: string;
  item: THouseholdDuesItem | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<PaymentValues | null>(null);
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amountNaira: 0, paymentReference: "", paymentMethod: "" },
  });

  const pay = useRecordDuesPayment(zoneId);

  function confirmPay(values: PaymentValues) {
    if (!item) {
      return;
    }
    pay.mutate(
      {
        duesId: item.id,
        body: {
          amountKobo: nairaToKobo(values.amountNaira),
          paymentReference: values.paymentReference?.trim() || undefined,
          paymentMethod: values.paymentMethod?.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast("Payment recorded.");
          setConfirmOpen(false);
          setPendingValues(null);
          form.reset();
          onClose();
        },
      },
    );
  }

  return (
    <>
      <Dialog open={Boolean(item) && !confirmOpen} title="Record payment" onClose={onClose}>
        {item && (
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit((values) => {
              setPendingValues(values);
              setConfirmOpen(true);
            })}
          >
            <p className="text-sm text-muted-foreground">
              {item.household} {item.street} · {item.period}
              <br />
              Balance due {formatKobo(item.amountDueKobo)} (paid {formatKobo(item.amountPaidKobo)})
            </p>
            <Field label="Amount (₦)" error={form.formState.errors.amountNaira?.message}>
              <Input
                type="number"
                min={0}
                step="0.01"
                {...form.register("amountNaira", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Reference (optional)">
              <Input {...form.register("paymentReference")} />
            </Field>
            <Field label="Method (optional)">
              <Input {...form.register("paymentMethod")} placeholder="Transfer, cash…" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        )}
      </Dialog>
      <ConfirmDialog
        open={confirmOpen && Boolean(item) && Boolean(pendingValues)}
        title="Confirm payment"
        detail={
          item && pendingValues
            ? `Record ${formatKobo(nairaToKobo(pendingValues.amountNaira))} for ${item.household} ${item.street}?`
            : ""
        }
        confirmLabel="Record payment"
        pending={pay.isPending}
        tone="primary"
        onClose={() => {
          setConfirmOpen(false);
          setPendingValues(null);
        }}
        onConfirm={() => {
          if (pendingValues) {
            confirmPay(pendingValues);
          }
        }}
      />
    </>
  );
}
