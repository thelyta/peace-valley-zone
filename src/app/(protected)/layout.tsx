"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/lib/app.store";
import { onUnauthorized } from "@/lib/client";
import { ApiError } from "@/lib/errors";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { getDefaultRouteForZone } from "@/modules/auth/utils/permission";
import { routeAllowed } from "@/modules/auth/utils/route-access";
import { AppShell } from "@/modules/layout/components/app-shell";
import { Skeleton } from "@/ui";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const activeZoneId = useAppStore((state) => state.activeZoneId);
  const setActiveZoneId = useAppStore((state) => state.setActiveZoneId);
  const clearSelection = useAppStore((state) => state.clearSelection);
  const query = useFetchSession();

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      clearSelection();
      queryClient.clear();
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    });
    return () => {
      unsubscribe();
    };
  }, [clearSelection, pathname, queryClient, router]);

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, query.error, router]);

  useEffect(() => {
    const zones = query.data?.zones ?? [];
    if (!zones.length) {
      return;
    }
    if (!activeZoneId || !zones.some((zone) => zone.zoneId === activeZoneId)) {
      setActiveZoneId(zones.length === 1 ? zones[0].zoneId : null);
    }
  }, [activeZoneId, query.data?.zones, setActiveZoneId]);

  useEffect(() => {
    const session = query.data;
    if (!session || !activeZoneId) {
      return;
    }
    if (!routeAllowed(session, activeZoneId, pathname)) {
      router.replace(getDefaultRouteForZone(session, activeZoneId));
    }
  }, [activeZoneId, pathname, query.data, router]);

  useEffect(() => {
    if (!query.data) return;
    if (!query.data.zones.length) {
      router.replace("/select-zone");
      return;
    }
    if (!activeZoneId && query.data.zones.length > 1 && pathname !== "/select-zone") {
      router.replace("/select-zone");
    }
  }, [activeZoneId, pathname, query.data, router]);

  if (query.isPending || !query.data) {
    return (
      <div className="min-h-screen p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mx-auto mt-8 h-64 max-w-6xl" />
      </div>
    );
  }

  if (!query.data.zones.length) {
    return null;
  }

  if (!activeZoneId && query.data.zones.length > 1 && pathname !== "/select-zone") {
    return null;
  }

  return <AppShell session={query.data}>{children}</AppShell>;
}
