"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { TGate } from "@/types/directory";
import type { GateStatus } from "@/types/enums";
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  SelectControl,
  Skeleton,
  useToast,
} from "@/ui";
import { useCreateGate } from "../mutations/use-create-gate";
import { useSetGateStreets } from "../mutations/use-set-gate-streets";
import { useUpdateGate } from "../mutations/use-update-gate";
import { useFetchGates } from "../queries/use-fetch-gates";
import { useFetchStreets } from "../queries/use-fetch-streets";

const createSchema = z.object({
  name: z.string().trim().min(1, "Enter a gate name."),
  description: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;

export function GatesManager({ zoneId }: { zoneId: string }) {
  const toast = useToast();
  const [statusGate, setStatusGate] = useState<TGate | null>(null);
  const [streetsGate, setStreetsGate] = useState<TGate | null>(null);
  const gatesQuery = useFetchGates(zoneId);
  const streetsQuery = useFetchStreets(zoneId);
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "" },
  });

  const create = useCreateGate(zoneId);
  const patchStatus = useUpdateGate(zoneId);

  if (gatesQuery.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (gatesQuery.isError) {
    return <ErrorState error="Unable to load gates." retry={() => void gatesQuery.refetch()} />;
  }

  const items = gatesQuery.data.items;
  const nextStatus: GateStatus | null = statusGate
    ? statusGate.status === "ACTIVE"
      ? "INACTIVE"
      : "ACTIVE"
    : null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Gates</h2>
        <p className="text-sm text-muted-foreground">Manage entry gates and street mappings.</p>
      </div>

      <form
        className="space-y-3 rounded-xl border border-border bg-card p-4"
        onSubmit={form.handleSubmit((values) =>
          create.mutate(
            {
              name: values.name.trim(),
              description: values.description?.trim() || undefined,
            },
            {
              onSuccess: () => {
                form.reset();
                toast("Gate created.");
              },
            },
          ),
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Gate name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} autoComplete="off" />
          </Field>
          <Field label="Description (optional)">
            <Input {...form.register("description")} autoComplete="off" />
          </Field>
        </div>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Adding…" : "Add gate"}
        </Button>
      </form>

      {!items.length ? (
        <EmptyState title="No gates yet" detail="Add a gate so visitors can be directed." />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {items.map((gate) => (
              <GateCard
                key={gate.id}
                gate={gate}
                onToggleStatus={() => setStatusGate(gate)}
                onMapStreets={() => setStreetsGate(gate)}
              />
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Streets</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((gate) => (
                  <tr className="border-t border-border" key={gate.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{gate.name}</p>
                      {gate.description && (
                        <p className="text-muted-foreground">{gate.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={gate.status === "ACTIVE" ? "good" : "neutral"}>
                        {gate.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {gate.gateStreets.length
                        ? gate.gateStreets
                            .map((item) =>
                              item.isDefault ? `${item.street.name} (default)` : item.street.name,
                            )
                            .join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => setStreetsGate(gate)}>
                          Map streets
                        </Button>
                        <Button variant="secondary" onClick={() => setStatusGate(gate)}>
                          {gate.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(statusGate)}
        title={nextStatus === "INACTIVE" ? "Deactivate gate" : "Activate gate"}
        detail={
          statusGate ? `${statusGate.name} will be marked ${nextStatus?.toLowerCase() ?? ""}.` : ""
        }
        confirmLabel={nextStatus === "INACTIVE" ? "Deactivate" : "Activate"}
        pending={patchStatus.isPending}
        tone={nextStatus === "INACTIVE" ? "danger" : "primary"}
        onClose={() => setStatusGate(null)}
        onConfirm={() => {
          if (statusGate && nextStatus) {
            patchStatus.mutate(
              { gateId: statusGate.id, body: { status: nextStatus } },
              {
                onSuccess: () => {
                  setStatusGate(null);
                  toast("Gate status updated.");
                },
              },
            );
          }
        }}
      />

      <MapStreetsDialog
        zoneId={zoneId}
        gate={streetsGate}
        streets={streetsQuery.data?.items ?? []}
        streetsLoading={streetsQuery.isPending}
        onClose={() => setStreetsGate(null)}
      />
    </section>
  );
}

function GateCard({
  gate,
  onToggleStatus,
  onMapStreets,
}: {
  gate: TGate;
  onToggleStatus: () => void;
  onMapStreets: () => void;
}) {
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{gate.name}</p>
          <Badge tone={gate.status === "ACTIVE" ? "good" : "neutral"}>{gate.status}</Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            {gate.gateStreets.length
              ? gate.gateStreets.map((item) => item.street.name).join(", ")
              : "No streets mapped"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onMapStreets}>
          Map streets
        </Button>
        <Button variant="secondary" onClick={onToggleStatus}>
          {gate.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </Button>
      </div>
    </li>
  );
}

function MapStreetsDialog({
  zoneId,
  gate,
  streets,
  streetsLoading,
  onClose,
}: {
  zoneId: string;
  gate: TGate | null;
  streets: { id: string; name: string; isActive: boolean }[];
  streetsLoading: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [streetIds, setStreetIds] = useState<string[]>([]);
  const [defaultStreetId, setDefaultStreetId] = useState("");

  useEffect(() => {
    if (!gate) {
      return;
    }
    const ids = gate.gateStreets.map((item) => item.streetId);
    setStreetIds(ids);
    setDefaultStreetId(gate.gateStreets.find((item) => item.isDefault)?.streetId ?? ids[0] ?? "");
  }, [gate]);

  const save = useSetGateStreets(zoneId);

  function submit() {
    if (!gate) {
      return;
    }
    save.mutate(
      {
        gateId: gate.id,
        body: { streetIds, defaultStreetId: defaultStreetId || undefined },
      },
      {
        onSuccess: () => {
          toast("Gate streets updated.");
          onClose();
        },
      },
    );
  }

  function toggleStreet(streetId: string) {
    setStreetIds((current) => {
      if (current.includes(streetId)) {
        const next = current.filter((id) => id !== streetId);
        if (defaultStreetId === streetId) {
          setDefaultStreetId(next[0] ?? "");
        }
        return next;
      }
      const next = [...current, streetId];
      if (!defaultStreetId) {
        setDefaultStreetId(streetId);
      }
      return next;
    });
  }

  return (
    <Dialog open={Boolean(gate)} title={`Map streets — ${gate?.name ?? ""}`} onClose={onClose}>
      {streetsLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !streets.length ? (
        <EmptyState title="No streets available" detail="Create streets before mapping a gate." />
      ) : (
        <div className="space-y-4">
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {streets.map((street) => (
              <li key={street.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={streetIds.includes(street.id)}
                    onChange={() => toggleStreet(street.id)}
                  />
                  <span>
                    {street.name}
                    {!street.isActive ? " (inactive)" : ""}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <Field label="Default street">
            <SelectControl
              value={defaultStreetId}
              onValueChange={setDefaultStreetId}
              disabled={!streetIds.length}
              placeholder="Select default"
              options={[
                { value: "", label: "Select default" },
                ...streets
                  .filter((street) => streetIds.includes(street.id))
                  .map((street) => ({ value: street.id, label: street.name })),
              ]}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={save.isPending || (streetIds.length > 0 && !defaultStreetId)}
            >
              {save.isPending ? "Saving…" : "Save mapping"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
