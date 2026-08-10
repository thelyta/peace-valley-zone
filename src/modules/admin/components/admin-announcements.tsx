"use client";

import { useAppStore } from "@/lib/app.store";
import { AnnouncementFeed } from "@/modules/announcements";

export default function AdminAnnouncementsPage() {
  const zoneId = useAppStore((state) => state.activeZoneId);
  if (!zoneId) {
    return null;
  }
  return <AnnouncementFeed zoneId={zoneId} admin />;
}
