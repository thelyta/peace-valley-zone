"use client";

import { Suspense } from "react";
import { useAppStore } from "@/lib/app.store";
import { VisitorsReport } from "@/modules/reports";
import { Skeleton } from "@/ui";

function VisitationContent() {
  const zoneId = useAppStore((state) => state.activeZoneId);
  if (!zoneId) {
    return null;
  }
  return <VisitorsReport zoneId={zoneId} />;
}

export default function VisitationPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <VisitationContent />
    </Suspense>
  );
}
