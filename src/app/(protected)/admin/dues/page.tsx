"use client";

import { useAppStore } from "@/lib/app.store";
import { DuesAdmin } from "@/modules/dues";

export default function DuesPage() {
  const zoneId = useAppStore((state) => state.activeZoneId);
  if (!zoneId) {
    return null;
  }
  return <DuesAdmin zoneId={zoneId} />;
}
