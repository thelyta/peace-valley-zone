"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAppStore } from "@/lib/app.store";
import { AnnouncementPreview } from "@/modules/announcements";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import {
  useFetchVisitorEligibility,
  VisitorHistory,
  VisitorInvite,
} from "@/modules/visitor-passes";
import {
  Badge,
  EmptyState,
  Icon,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/ui";

function ResidentHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isLoading } = useFetchSession();
  const zoneId = useAppStore((state) => state.activeZoneId);

  const households = session?.households.filter((item) => item.zoneId === zoneId) ?? [];
  const householdParam = searchParams.get("household");
  const selected = households.find((item) => item.householdId === householdParam) ?? households[0];

  useEffect(() => {
    if (!selected || households.length <= 1) {
      return;
    }
    if (householdParam !== selected.householdId) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("household", selected.householdId);
      router.replace(`/resident?${next.toString()}`);
    }
  }, [householdParam, households.length, router, searchParams, selected]);

  const eligibilityQuery = useFetchVisitorEligibility(zoneId ?? "", selected?.householdId ?? "");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!zoneId || !selected) {
    return (
      <EmptyState
        title="No home selected"
        detail="Contact estate management if you expected to see a home here."
      />
    );
  }

  const eligibility = eligibilityQuery.data;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invite visitors</h1>
            <p className="mt-1 text-muted-foreground">
              {selected.houseNumber} {selected.streetName}
            </p>
          </div>
          {eligibility ? (
            <Badge
              tone={eligibility.allowed ? "good" : "warning"}
              className="min-h-9 gap-1.5 px-3 text-sm"
            >
              <Icon icon={eligibility.allowed ? CheckCircle2 : CircleAlert} size={16} />
              {eligibility.allowed ? "Can invite visitors" : "Invites paused"}
            </Badge>
          ) : null}
        </div>

        {households.length > 1 ? (
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="household-select">Household</Label>
            <Select
              value={selected.householdId}
              onValueChange={(householdId) => {
                const next = new URLSearchParams(searchParams.toString());
                next.set("household", householdId);
                router.replace(`/resident?${next.toString()}`);
              }}
            >
              <SelectTrigger id="household-select">
                <SelectValue placeholder="Choose household" />
              </SelectTrigger>
              <SelectContent>
                {households.map((home) => (
                  <SelectItem key={home.householdId} value={home.householdId}>
                    {home.houseNumber} {home.streetName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <VisitorInvite zoneId={zoneId} householdId={selected.householdId} />
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Recent visitor passes</h2>
            <Link
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              href={`/resident/visitors?household=${encodeURIComponent(selected.householdId)}`}
            >
              View all
            </Link>
          </div>
          <VisitorHistory zoneId={zoneId} householdId={selected.householdId} limit={5} />
        </section>
      </div>

      <AnnouncementPreview zoneId={zoneId} />
    </div>
  );
}

export default function ResidentPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <ResidentHome />
    </Suspense>
  );
}
