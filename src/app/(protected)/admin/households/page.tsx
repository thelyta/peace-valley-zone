"use client";

import { useAppStore } from "@/lib/app.store";
import { HouseholdsDirectory } from "@/modules/households";

export default function HouseholdsPage() {
  const zoneId = useAppStore((state) => state.activeZoneId);
  if (!zoneId) {
    return null;
  }
  return <HouseholdsDirectory zoneId={zoneId} />;
}
