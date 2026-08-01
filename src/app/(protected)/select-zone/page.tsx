"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app.store";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { getDefaultRouteForZone } from "@/modules/auth/utils/permission";
import { Skeleton } from "@/ui";

export default function SelectZonePage() {
  const { data, isLoading } = useFetchSession();
  const router = useRouter();
  const setZone = useAppStore((state) => state.setActiveZoneId);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">Choose your zone</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick the estate zone you want to work in right now.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {data?.zones.map((zone) => (
          <button
            type="button"
            className="rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-accent"
            key={zone.zoneId}
            onClick={() => {
              setZone(zone.zoneId);
              router.replace(getDefaultRouteForZone(data, zone.zoneId));
            }}
          >
            <p className="font-semibold text-foreground">{zone.zone.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{zone.estate.name}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
