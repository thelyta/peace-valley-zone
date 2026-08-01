"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { TStreet } from "@/types/directory";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Skeleton,
  useToast,
} from "@/ui";
import { useCreateStreet } from "../mutations/use-create-street";
import { useUpdateStreet } from "../mutations/use-update-street";
import { useFetchStreets } from "../queries/use-fetch-streets";

const createSchema = z.object({
  name: z.string().trim().min(1, "Enter a street name."),
});

type CreateValues = z.infer<typeof createSchema>;

export function StreetsManager({ zoneId }: { zoneId: string }) {
  const toast = useToast();
  const [pendingStreet, setPendingStreet] = useState<TStreet | null>(null);
  const query = useFetchStreets(zoneId);
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "" },
  });

  const create = useCreateStreet(zoneId);
  const toggle = useUpdateStreet(zoneId);

  if (query.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (query.isError) {
    return <ErrorState error="Unable to load streets." retry={() => void query.refetch()} />;
  }

  const items = query.data.items;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Streets</h2>
        <p className="text-sm text-muted-foreground">Create and activate streets for households.</p>
      </div>

      <form
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end"
        onSubmit={form.handleSubmit((values) =>
          create.mutate(
            { name: values.name.trim() },
            {
              onSuccess: () => {
                form.reset();
                toast("Street created.");
              },
            },
          ),
        )}
      >
        <div className="flex-1">
          <Field label="Street name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} autoComplete="off" />
          </Field>
        </div>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Adding…" : "Add street"}
        </Button>
      </form>

      {!items.length ? (
        <EmptyState title="No streets yet" detail="Add the first street to place households." />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {items.map((street) => (
              <li key={street.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{street.name}</p>
                    <Badge tone={street.isActive ? "good" : "neutral"}>
                      {street.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setPendingStreet(street)}
                    disabled={toggle.isPending}
                  >
                    {street.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((street) => (
                  <tr className="border-t border-border" key={street.id}>
                    <td className="px-4 py-3">{street.name}</td>
                    <td className="px-4 py-3">
                      <Badge tone={street.isActive ? "good" : "neutral"}>
                        {street.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="secondary"
                        onClick={() => setPendingStreet(street)}
                        disabled={toggle.isPending}
                      >
                        {street.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingStreet)}
        title={pendingStreet?.isActive ? "Deactivate street" : "Activate street"}
        detail={
          pendingStreet
            ? `${pendingStreet.name} will be marked ${pendingStreet.isActive ? "inactive" : "active"}.`
            : ""
        }
        confirmLabel={pendingStreet?.isActive ? "Deactivate" : "Activate"}
        pending={toggle.isPending}
        tone={pendingStreet?.isActive ? "danger" : "primary"}
        onClose={() => setPendingStreet(null)}
        onConfirm={() => {
          if (pendingStreet) {
            toggle.mutate(
              { streetId: pendingStreet.id, body: { isActive: !pendingStreet.isActive } },
              {
                onSuccess: () => {
                  setPendingStreet(null);
                  toast("Street updated.");
                },
              },
            );
          }
        }}
      />
    </section>
  );
}
