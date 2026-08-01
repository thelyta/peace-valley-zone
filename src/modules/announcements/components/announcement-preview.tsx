"use client";

import Link from "next/link";
import type { TAnnouncement } from "@/types/announcements";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/ui";
import { formatDateTime } from "@/utils/dates";
import { useFetchAnnouncements } from "../queries/use-fetch-announcements";
import { AnnouncementDetailDialog, useAnnouncementDetail } from "./announcement-detail";

export function AnnouncementPreview({ zoneId, limit = 3 }: { zoneId: string; limit?: number }) {
  const query = useFetchAnnouncements(zoneId);
  const detail = useAnnouncementDetail();

  if (query.isPending) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (query.isError) {
    return <ErrorState error="Unable to load announcements." retry={() => void query.refetch()} />;
  }

  const items: TAnnouncement[] = query.data.items
    .filter((item) => item.status === "PUBLISHED")
    .slice(0, limit);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Latest announcements</h2>
        <Link
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          href="/resident/announcements"
        >
          View all
        </Link>
      </div>

      {!items.length ? (
        <EmptyState title="No announcements yet" />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full rounded-xl border border-border bg-card p-4 text-left transition hover:bg-muted/40"
                onClick={() => detail.open(item)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold tracking-tight">{item.title}</p>
                  {!item.read ? <Badge tone="warning">Unread</Badge> : null}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.publishedAt
                    ? formatDateTime(item.publishedAt)
                    : formatDateTime(item.createdAt)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnnouncementDetailDialog zoneId={zoneId} item={detail.selected} onClose={detail.close} />
    </section>
  );
}
