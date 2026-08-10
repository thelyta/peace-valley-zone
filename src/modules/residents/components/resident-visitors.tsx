"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAppStore } from "@/lib/app.store";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { VisitorHistory, VisitorInvite } from "@/modules/visitor-passes";
import {
  EmptyState,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/ui";

function VisitorsPageContent() {
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
      router.replace(`/resident/visitors?${next.toString()}`);
    }
  }, [householdParam, households.length, router, searchParams, selected]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!zoneId || !selected) {
    return (
      <EmptyState
        title="No home selected"
        detail="Contact estate management if you expected to see visitor passes here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visitor passes</h1>
          <p className="mt-1 text-muted-foreground">
            {selected.houseNumber} {selected.streetName}
          </p>
        </div>
        {households.length > 1 ? (
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="visitors-household">Household</Label>
            <Select
              value={selected.householdId}
              onValueChange={(householdId) => {
                const next = new URLSearchParams(searchParams.toString());
                next.set("household", householdId);
                router.replace(`/resident/visitors?${next.toString()}`);
              }}
            >
              <SelectTrigger id="visitors-household">
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
        <Link
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          href="/resident"
        >
          Back to home
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <VisitorInvite zoneId={zoneId} householdId={selected.householdId} />
        <section>
          <h2 className="mb-4 text-lg font-semibold">Pass history</h2>
          <VisitorHistory zoneId={zoneId} householdId={selected.householdId} />
        </section>
      </div>
    </div>
  );
}

export default function VisitorsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <VisitorsPageContent />
    </Suspense>
  );
}
