"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/lib/app.store";
import { ApiError } from "@/lib/errors";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { getDefaultRouteForZone } from "@/modules/auth/utils/permission";
import { Skeleton } from "@/ui";

export default function Home() {
  const router = useRouter();
  const activeZoneId = useAppStore((state) => state.activeZoneId);
  const query = useFetchSession();

  useEffect(() => {
    if (query.isPending) {
      return;
    }
    if (query.error instanceof ApiError && query.error.status === 401) {
      router.replace("/login");
      return;
    }
    const session = query.data;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!session.zones.length) {
      router.replace("/select-zone");
      return;
    }
    const zoneId =
      (activeZoneId && session.zones.some((zone) => zone.zoneId === activeZoneId)
        ? activeZoneId
        : null) ?? (session.zones.length === 1 ? session.zones[0].zoneId : null);
    if (!zoneId) {
      router.replace("/select-zone");
      return;
    }
    router.replace(getDefaultRouteForZone(session, zoneId));
  }, [activeZoneId, query.data, query.error, query.isPending, router]);

  return (
    <div className="min-h-screen p-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="mx-auto mt-8 h-64 max-w-6xl" />
    </div>
  );
}
