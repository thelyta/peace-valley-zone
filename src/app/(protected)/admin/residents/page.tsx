"use client";

import { useAppStore } from "@/lib/app.store";
import { ResidentsDirectory } from "@/modules/residents";

export default function ResidentsPage() {
  const zoneId = useAppStore((state) => state.activeZoneId);
  if (!zoneId) {
    return null;
  }
  return <ResidentsDirectory zoneId={zoneId} />;
}
