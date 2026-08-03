"use client";

import { useEffect, useRef, useState } from "react";
import type { TAnnouncement } from "@/types/announcements";
import type { AnnouncementStatus } from "@/types/enums";
import { Badge, Button, Dialog, useToast } from "@/ui";
import { formatDateTime } from "@/utils/dates";
import { useArchiveAnnouncement } from "../mutations/use-archive-announcement";
import { useMarkAnnouncementRead } from "../mutations/use-mark-announcement-read";
import { usePublishAnnouncement } from "../mutations/use-publish-announcement";

function statusTone(status: AnnouncementStatus | string) {
  switch (status) {
    case "PUBLISHED":
      return "good" as const;
    case "DRAFT":
      return "warning" as const;
    case "ARCHIVED":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

export function AnnouncementCard({
  zoneId,
  item,
  admin = false,
  onOpen,
}: {
  zoneId: string;
  item: TAnnouncement;
  admin?: boolean;
  onOpen?: (item: TAnnouncement) => void;
}) {
  const toast = useToast();
  const publish = usePublishAnnouncement(zoneId);
  const archive = useArchiveAnnouncement(zoneId);

  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button type="button" className="text-left" onClick={() => onOpen?.(item)}>
            <h2 className="text-lg font-semibold tracking-tight hover:underline">{item.title}</h2>
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            {admin ? <Badge tone={statusTone(item.status)}>{item.status}</Badge> : null}
            {!item.read && item.status === "PUBLISHED" ? (
              <Badge tone="warning">Unread</Badge>
            ) : null}
          </div>
        </div>
        {admin ? (
          <div className="flex flex-wrap gap-2">
            {item.status === "DRAFT" ? (
              <Button
                variant="secondary"
                disabled={publish.isPending}
                onClick={() =>
                  publish.mutate(item.id, { onSuccess: () => toast("Announcement published.") })
                }
              >
                Publish
              </Button>
            ) : null}
            {item.status !== "ARCHIVED" ? (
              <Button
                variant="secondary"
                disabled={archive.isPending}
                onClick={() =>
                  archive.mutate(item.id, { onSuccess: () => toast("Announcement archived.") })
                }
              >
                Archive
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-muted-foreground">{item.body}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {item.publishedAt
            ? `Published ${formatDateTime(item.publishedAt)}`
            : `Created ${formatDateTime(item.createdAt)}`}
        </p>
        <Button onClick={() => onOpen?.(item)}>
          Open
        </Button>
      </div>
    </article>
  );
}

export function AnnouncementDetailDialog({
  zoneId,
  item,
  onClose,
}: {
  zoneId: string;
  item: TAnnouncement | null;
  onClose: () => void;
}) {
  const markRead = useMarkAnnouncementRead(zoneId);
  const markedId = useRef<string | null>(null);

  useEffect(() => {
    if (!item || item.read || item.status !== "PUBLISHED") {
      return;
    }
    if (markedId.current === item.id) {
      return;
    }
    markedId.current = item.id;
    markRead.mutate(item.id);
  }, [item, markRead.mutate]);

  if (!item) {
    return null;
  }

  return (
    <Dialog open={Boolean(item)} title="Announcement" onClose={onClose} className="sm:max-w-xl">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{item.title}</h2>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">{item.body}</p>
        <p className="text-sm text-muted-foreground">
          {item.publishedAt
            ? `Published ${formatDateTime(item.publishedAt)}`
            : `Created ${formatDateTime(item.createdAt)}`}
        </p>
      </div>
    </Dialog>
  );
}

export function useAnnouncementDetail() {
  const [selected, setSelected] = useState<TAnnouncement | null>(null);
  return {
    selected,
    open: setSelected,
    close: () => setSelected(null),
  };
}
