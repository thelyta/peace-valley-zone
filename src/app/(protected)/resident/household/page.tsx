"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/app.store";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import {
  HouseholdMembersPanel,
  MyMemberRequestsList,
  RequestHouseholdMemberForm,
} from "@/modules/households";
import { Badge, EmptyState, Skeleton } from "@/ui";

export default function HouseholdPage() {
  const { data, isLoading } = useFetchSession();
  const zoneId = useAppStore((state) => state.activeZoneId);
  const households = data?.households.filter((item) => item.zoneId === zoneId) ?? [];

  if (isLoading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full" />
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">My home</h1>
      <p className="mt-1 text-muted-foreground">
        Members and household requests for homes you belong to.
      </p>
      {!households.length ? (
        <div className="mt-5">
          <EmptyState
            title="No homes found"
            detail="Contact estate management if you expected to see a home here."
          />
        </div>
      ) : (
        <ul className="mt-5 space-y-6">
          {households.map((home) => {
            const isPrimary = home.role === "PRIMARY";
            return (
              <li
                className="rounded-xl border border-border bg-card p-4 sm:p-5"
                key={home.householdId}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {home.houseNumber} {home.streetName}
                    </p>
                    <p className="text-sm capitalize text-muted-foreground">
                      {home.role.toLowerCase().replaceAll("_", " ")}
                    </p>
                  </div>
                  <Badge tone={home.canInviteVisitors ? "good" : "warning"}>
                    {home.canInviteVisitors ? "Can invite" : "Cannot invite"}
                  </Badge>
                </div>

                {zoneId ? (
                  <div className="mt-4 space-y-2">
                    <h2 className="text-sm font-semibold tracking-tight">Household members</h2>
                    <HouseholdMembersPanel zoneId={zoneId} householdId={home.householdId} />
                  </div>
                ) : null}

                {zoneId && isPrimary ? (
                  <div className="mt-6 grid gap-6 border-t border-border pt-6 lg:grid-cols-2 lg:items-start">
                    <RequestHouseholdMemberForm zoneId={zoneId} householdId={home.householdId} />
                    <MyMemberRequestsList zoneId={zoneId} householdId={home.householdId} />
                  </div>
                ) : null}

                <Link
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                  href={`/resident?household=${encodeURIComponent(home.householdId)}`}
                >
                  Invite visitors
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
