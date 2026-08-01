"use client";

import { useAppStore } from "@/lib/app.store";
import { MemberRequestsList } from "@/modules/households";

export default function MemberRequestsPage() {
  const zoneId = useAppStore((state) => state.activeZoneId);
  if (!zoneId) {
    return null;
  }
  return <MemberRequestsList zoneId={zoneId} />;
}
