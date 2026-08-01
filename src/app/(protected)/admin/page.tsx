"use client";

import { useAppStore } from "@/lib/app.store";
import { AdminOverview } from "@/modules/reports";

export default function AdminPage() {
  const zoneId = useAppStore((state) => state.activeZoneId);
  if (!zoneId) {
    return null;
  }
  return <AdminOverview zoneId={zoneId} />;
}
