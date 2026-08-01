"use client";

import type { THouseholdMemberItem } from "@/types/households";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/ui";
import { useFetchHouseholdMembers } from "../queries/use-fetch-household-members";

function roleLabel(role: THouseholdMemberItem["role"]) {
  return role.toLowerCase().replaceAll("_", " ");
}

function statusTone(status: THouseholdMemberItem["status"]) {
  switch (status) {
    case "ACTIVE":
      return "good" as const;
    case "SUSPENDED":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export function HouseholdMembersPanel({
  zoneId,
  householdId,
}: {
  zoneId: string;
  householdId: string;
}) {
  const query = useFetchHouseholdMembers(zoneId, householdId);

  if (query.isPending) {
    return <Skeleton className="h-28 w-full" />;
  }
  if (query.isError) {
    return (
      <ErrorState error="Unable to load household members." retry={() => void query.refetch()} />
    );
  }

  const items = query.data.items;

  if (!items.length) {
    return <EmptyState title="No members yet" />;
  }

  return (
    <ul className="space-y-2">
      {items.map((member) => (
        <li
          key={member.id}
          className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5"
        >
          <div>
            <p className="font-medium">{member.user.fullName}</p>
            <p className="text-sm capitalize text-muted-foreground">{roleLabel(member.role)}</p>
          </div>
          <Badge tone={statusTone(member.status)}>{member.status}</Badge>
        </li>
      ))}
    </ul>
  );
}
