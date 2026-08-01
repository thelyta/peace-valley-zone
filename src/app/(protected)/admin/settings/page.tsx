"use client";

import { useAppStore } from "@/lib/app.store";
import { ZoneSettingsPage } from "@/modules/zones";

export default function SettingsPage() {
  const zoneId = useAppStore((state) => state.activeZoneId);
  if (!zoneId) {
    return null;
  }
  return <ZoneSettingsPage zoneId={zoneId} />;
}
