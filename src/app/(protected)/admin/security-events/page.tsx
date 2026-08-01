"use client";

import { Suspense } from "react";
import { useAppStore } from "@/lib/app.store";
import { SecurityEventsReport } from "@/modules/reports";
import { Skeleton } from "@/ui";

function SecurityEventsContent() {
  const zoneId = useAppStore((state) => state.activeZoneId);
  if (!zoneId) {
    return null;
  }
  return <SecurityEventsReport zoneId={zoneId} />;
}

export default function SecurityEventsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <SecurityEventsContent />
    </Suspense>
  );
}
