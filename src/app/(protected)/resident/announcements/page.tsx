"use client";

import { useAppStore } from "@/lib/app.store";
import { AnnouncementFeed } from "@/modules/announcements";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { EmptyState, Skeleton } from "@/ui";

export default function ResidentAnnouncementsPage() {
  const { data, isLoading } = useFetchSession();
  const zoneId = useAppStore((state) => state.activeZoneId);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </section>
    );
  }

  if (!zoneId || !data) {
    return <EmptyState title="No zone selected" detail="Choose a zone to view announcements." />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="mt-1 text-muted-foreground">Updates from estate management.</p>
      </header>
      <AnnouncementFeed zoneId={zoneId} />
    </section>
  );
}
