"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { featureFlags } from "@/lib/feature-flags";
import { ChangePasswordForm, SessionsList } from "@/modules/auth";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { hasPermission, Permission } from "@/modules/auth/utils/permission";
import { GatesManager, StreetsManager } from "@/modules/directory";
import type { DuesGatePolicy } from "@/types/enums";
import { Button, EmptyState, ErrorState, Field, Input, SelectControl, Skeleton } from "@/ui";
import { useUpdateZoneSettings } from "../mutations/use-update-zone-settings";
import { useFetchZone } from "../queries/use-fetch-zone";

type SettingsForm = {
  visitorExpiryHours: number;
  maxVisitorPartySize: number;
  duesGatePolicy: DuesGatePolicy;
  announcementSecurityVisibility: "true" | "false";
};

type SettingsTab = "personal" | "general" | "streets" | "gates";

export function ZoneSettingsPage({ zoneId }: { zoneId: string }) {
  const sessionQuery = useFetchSession();
  const session = sessionQuery.data;
  const canWriteSettings =
    session != null && hasPermission(session, zoneId, Permission.ZONE_SETTINGS_WRITE);
  const canManageStreets =
    session != null && hasPermission(session, zoneId, Permission.STREETS_MANAGE);
  const canManageGates = session != null && hasPermission(session, zoneId, Permission.GATES_MANAGE);

  const canGeneral = canWriteSettings;
  const canStreets = featureFlags.adminStreetAndGateSettings && canManageStreets;
  const canGates = featureFlags.adminStreetAndGateSettings && canManageGates;
  const visibleTabs: Array<{ id: SettingsTab; label: string }> = [
    { id: "personal", label: "Personal" },
    ...(canGeneral ? [{ id: "general" as const, label: "General" }] : []),
    ...(canStreets ? [{ id: "streets" as const, label: "Streets" }] : []),
    ...(canGates ? [{ id: "gates" as const, label: "Gates" }] : []),
  ];
  const [tab, setTab] = useState<SettingsTab>("personal");
  const activeTab = visibleTabs.some((item) => item.id === tab) ? tab : "personal";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and configure this zone.
        </p>
      </div>

      {visibleTabs.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Settings sections">
          {visibleTabs.map((item) => (
            <Button
              key={item.id}
              role="tab"
              aria-selected={activeTab === item.id}
              variant={activeTab === item.id ? "default" : "outline"}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}

      {activeTab === "personal" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold">Your signed-in devices</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review the devices currently signed in to your account.
            </p>
          </div>
          <SessionsList />
          <ChangePasswordForm />
        </div>
      )}
      {activeTab === "general" && canGeneral && <ZoneSettingsForm zoneId={zoneId} />}
      {activeTab === "streets" && canStreets && <StreetsManager zoneId={zoneId} />}
      {activeTab === "gates" && canGates && <GatesManager zoneId={zoneId} />}
    </section>
  );
}

export function ZoneSettingsForm({ zoneId }: { zoneId: string }) {
  const form = useForm<SettingsForm>();
  const query = useFetchZone(zoneId);

  useEffect(() => {
    const settings = query.data?.settings;
    if (!settings) {
      return;
    }
    form.reset({
      visitorExpiryHours: settings.visitorExpiryMinutes / 60,
      maxVisitorPartySize: settings.maxVisitorPartySize,
      duesGatePolicy: settings.duesGatePolicy as DuesGatePolicy,
      announcementSecurityVisibility: settings.announcementSecurityVisibility ? "true" : "false",
    });
  }, [form, query.data?.settings]);

  const save = useUpdateZoneSettings(zoneId);

  function submit(values: SettingsForm) {
    save.mutate({
      visitorExpiryMinutes: values.visitorExpiryHours * 60,
      maxVisitorPartySize: values.maxVisitorPartySize,
      duesGatePolicy: values.duesGatePolicy,
      announcementSecurityVisibility: values.announcementSecurityVisibility === "true",
    });
  }

  if (query.isPending) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (query.isError) {
    return <ErrorState error="Unable to load zone settings." retry={() => void query.refetch()} />;
  }
  if (!query.data.settings) {
    return (
      <EmptyState
        title="Settings unavailable"
        detail="Zone settings have not been initialized yet."
      />
    );
  }

  return (
    <form
      className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-5"
      onSubmit={form.handleSubmit(submit)}
    >
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="mt-1 text-sm text-muted-foreground">{query.data.name}</p>
      </div>
      <Field label="Visitor pass expiry (hours)">
        <Input
          type="number"
          min={1}
          step={0.5}
          {...form.register("visitorExpiryHours", { valueAsNumber: true, min: 1 })}
        />
      </Field>
      <Field label="Maximum visitors number">
        <Input
          type="number"
          min={1}
          {...form.register("maxVisitorPartySize", { valueAsNumber: true, min: 1 })}
        />
      </Field>
      <Field label="Dues gate policy">
        <SelectControl
          value={form.watch("duesGatePolicy") ?? "BLOCK_IF_NOT_ELIGIBLE"}
          onValueChange={(value) =>
            form.setValue("duesGatePolicy", value as DuesGatePolicy, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          options={[
            {
              value: "BLOCK_IF_NOT_ELIGIBLE",
              label: "Block invitations when dues are unpaid",
            },
            {
              value: "ALLOW_ALWAYS",
              label: "Allow invitations regardless of dues",
            },
          ]}
        />
      </Field>
      <Field label="Security can see announcements">
        <SelectControl
          value={form.watch("announcementSecurityVisibility") ?? "true"}
          onValueChange={(value) =>
            form.setValue(
              "announcementSecurityVisibility",
              value as SettingsForm["announcementSecurityVisibility"],
              { shouldValidate: true, shouldDirty: true },
            )
          }
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
        />
      </Field>
      {save.isSuccess && (
        <p role="status" className="text-sm text-success-soft-foreground">
          Settings saved.
        </p>
      )}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
