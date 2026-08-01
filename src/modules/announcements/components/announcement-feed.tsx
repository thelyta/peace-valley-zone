"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Megaphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { TAnnouncement } from "@/types/announcements";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  Input,
  Skeleton,
  Textarea,
  useToast,
} from "@/ui";
import { useCreateAnnouncement } from "../mutations/use-create-announcement";
import { useFetchAnnouncements } from "../queries/use-fetch-announcements";
import {
  AnnouncementCard,
  AnnouncementDetailDialog,
  useAnnouncementDetail,
} from "./announcement-detail";

const createSchema = z.object({
  title: z.string().trim().min(1, "Enter a title."),
  body: z.string().trim().min(1, "Enter a message."),
});

type CreateValues = z.infer<typeof createSchema>;

export function AnnouncementFeed({ zoneId, admin = false }: { zoneId: string; admin?: boolean }) {
  const toast = useToast();
  const query = useFetchAnnouncements(zoneId);
  const detail = useAnnouncementDetail();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: "", body: "" },
  });

  const create = useCreateAnnouncement(zoneId);

  function submitCreate(values: CreateValues, publish: boolean) {
    create.mutate(
      {
        title: values.title.trim(),
        body: values.body.trim(),
        publish,
      },
      {
        onSuccess: () => {
          toast(publish ? "Announcement published." : "Draft announcement saved.");
          form.reset();
        },
      },
    );
  }

  if (query.isPending) {
    return <Skeleton className="h-56 w-full" />;
  }
  if (query.isError) {
    return <ErrorState error="Unable to load announcements." retry={() => void query.refetch()} />;
  }

  const items: TAnnouncement[] = query.data.items;

  return (
    <section className="space-y-5">
      {admin ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
            <p className="mt-1 text-sm text-muted-foreground">Publish updates for residents.</p>
          </div>
          <form
            className="space-y-3 rounded-xl border border-border bg-card p-5"
            onSubmit={form.handleSubmit((values) => submitCreate(values, true))}
          >
            <h2 className="font-semibold">New announcement</h2>
            <Field label="Title" error={form.formState.errors.title?.message}>
              <Input {...form.register("title")} />
            </Field>
            <Field label="Message" error={form.formState.errors.body?.message}>
              <Textarea rows={4} {...form.register("body")} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={create.isPending}>
                <Icon icon={Megaphone} size={24} />
                {create.isPending ? "Saving…" : "Publish announcement"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={create.isPending}
                onClick={form.handleSubmit((values) => submitCreate(values, false))}
              >
                Save draft
              </Button>
            </div>
          </form>
        </>
      ) : null}

      {!items.length ? (
        <EmptyState title="No announcements" />
      ) : (
        items.map((item) => (
          <AnnouncementCard
            key={item.id}
            zoneId={zoneId}
            item={item}
            admin={admin}
            onOpen={detail.open}
          />
        ))
      )}

      <AnnouncementDetailDialog zoneId={zoneId} item={detail.selected} onClose={detail.close} />
    </section>
  );
}
