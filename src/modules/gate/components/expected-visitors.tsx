"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { customInstance } from "@/lib/mutator";
import { useEstateTimezone } from "@/modules/zones";
import { Button, Field, Input } from "@/ui";
import { formatDateTime } from "@/utils/dates";
import { userMessageForError } from "@/utils/error-messages";
import { gateKeys } from "../query-keys";

type ExpectedVisitor = {
  id: string;
  visitorName: string;
  visitorPhoneE164: string | null;
  partySize: number;
  note: string | null;
  expiresAt: string;
  houseNumber: string;
  streetName: string;
  inviterName: string;
};

export function ExpectedVisitors({ zoneId, gateId }: { zoneId: string; gateId: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ExpectedVisitor | null>(null);
  const [partySize, setPartySize] = useState("");
  const [message, setMessage] = useState("");
  const client = useQueryClient();
  const timeZone = useEstateTimezone(zoneId);
  const key = ["expected-visitors", zoneId, gateId];
  const query = useQuery({
    queryKey: [...key, search],
    queryFn: () =>
      customInstance<{ items: ExpectedVisitor[] }>({
        url: `/v1/zones/${zoneId}/gates/${gateId}/expected-visitors`,
        params: { search },
      }),
    refetchInterval: 10_000,
  });
  const admit = useMutation({
    mutationFn: (visitor: ExpectedVisitor) =>
      customInstance<{ admitted: true }>({
        url: `/v1/zones/${zoneId}/gates/${gateId}/visitor-passes/${visitor.id}/admit`,
        method: "POST",
        data: { method: "EXPECTED", observedPartySize: Number(partySize) },
      }),
    onSuccess: async () => {
      setSelected(null);
      setMessage("Admission confirmed.");
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: gateKeys.events.all(zoneId, gateId) }),
      ]);
    },
    onError: (error) => {
      setMessage(
        userMessageForError(
          error,
          "Admission could not be confirmed. Refresh the list and try again.",
        ),
      );
      void client.invalidateQueries({ queryKey: key });
    },
  });
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Expected visitors</h2>
        <Button type="button" variant="outline" onClick={() => void query.refetch()}>
          Refresh
        </Button>
      </div>
      <Field label="Search by visitor name">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Enter a name"
        />
      </Field>
      <p className="text-sm text-muted-foreground">To search by code, use Check visitor pass.</p>
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      {query.isLoading ? (
        <p>Loading expected visitors…</p>
      ) : query.isError ? (
        <p role="alert">
          {userMessageForError(query.error, "Expected visitors could not be loaded.")}
        </p>
      ) : !query.data?.items.length ? (
        <p className="text-sm text-muted-foreground">No expected visitors found.</p>
      ) : (
        <ul className="space-y-3">
          {query.data.items.map((visitor) => (
            <li key={visitor.id} className="rounded-lg border border-border p-3">
              <p className="font-semibold">{visitor.visitorName}</p>
              <p className="text-sm text-muted-foreground">
                Invited by {visitor.inviterName} · {visitor.houseNumber} {visitor.streetName}
              </p>
              <p className="text-sm text-muted-foreground">
                {visitor.partySize} expected · Expires {formatDateTime(visitor.expiresAt, timeZone)}
              </p>
              {visitor.visitorPhoneE164 ? (
                <p className="text-sm">{visitor.visitorPhoneE164}</p>
              ) : null}
              {visitor.note ? <p className="text-sm">{visitor.note}</p> : null}
              {selected?.id === visitor.id ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm">
                    Confirm this is the visitor invited by {visitor.inviterName} before admitting
                    them.
                  </p>
                  <Field label="Visitors present">
                    <Input
                      type="number"
                      min={1}
                      max={32767}
                      value={partySize}
                      onChange={(event) => setPartySize(event.target.value)}
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelected(null)}
                      disabled={admit.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => admit.mutate(visitor)}
                      disabled={
                        admit.isPending ||
                        !Number.isInteger(Number(partySize)) ||
                        Number(partySize) < 1 ||
                        Number(partySize) > 32767
                      }
                    >
                      {admit.isPending ? "Admitting…" : "Confirm admission"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="mt-3"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelected(visitor);
                    setPartySize(String(visitor.partySize));
                    setMessage("");
                  }}
                >
                  Review visitor
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {(query.data?.items.length ?? 0) === 100 ? (
        <p className="text-sm text-muted-foreground">
          Showing the latest 100 matches. Search by name to narrow the list.
        </p>
      ) : null}
    </section>
  );
}
