"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { hasPermission, Permission } from "@/modules/auth/utils/permission";
import { AssignSecurityGatesDialog } from "@/modules/directory";
import { householdsQueryOptions } from "@/modules/households/queries/use-fetch-households";
import type { UserStatus, ZoneRole } from "@/types/enums";
import type { TZoneUserItem } from "@/types/residents";
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  Input,
  SelectControl,
  Skeleton,
  useToast,
} from "@/ui";
import { normalizeNigerianPhone } from "@/utils/phone";
import { useInviteZoneUser } from "../mutations/use-invite-zone-user";
import { useResendActivationInvite } from "../mutations/use-resend-activation-invite";
import { useRevokeZoneUserAccess } from "../mutations/use-revoke-zone-user-access";
import { useFetchZoneUsers } from "../queries/use-fetch-zone-users";

function statusTone(status: UserStatus) {
  switch (status) {
    case "ACTIVE":
      return "good" as const;
    case "INVITED":
      return "warning" as const;
    case "SUSPENDED":
    case "DEACTIVATED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function ResidentsDirectory({ zoneId }: { zoneId: string }) {
  const sessionQuery = useFetchSession();
  const usersQuery = useFetchZoneUsers(zoneId);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignUser, setAssignUser] = useState<TZoneUserItem | null>(null);
  const [revokeUser, setRevokeUser] = useState<TZoneUserItem | null>(null);
  const [resendUser, setResendUser] = useState<TZoneUserItem | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const revoke = useRevokeZoneUserAccess(zoneId);
  const resendInvite = useResendActivationInvite(zoneId);
  const toast = useToast();

  const session = sessionQuery.data;
  const canInvite = session != null && hasPermission(session, zoneId, Permission.USERS_MANAGE);
  const canAssign = session != null && hasPermission(session, zoneId, Permission.SECURITY_ASSIGN);

  if (usersQuery.isPending) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (usersQuery.isError) {
    return <ErrorState error="Unable to load residents." retry={() => void usersQuery.refetch()} />;
  }

  const items = usersQuery.data.items;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? items.filter((item) =>
        [item.fullName, item.email, item.role, ...item.gates].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        ),
      )
    : items;
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const visibleItems = filteredItems.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Residents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zone members, invitations, and security gate access.
          </p>
        </div>
        {canInvite ? (
          <Button onClick={() => setInviteOpen(true)}>
            <Icon icon={UserPlus} size={24} />
            Invite resident
          </Button>
        ) : null}
      </div>

      <Field label="Search residents">
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Name, email, role, or gate"
        />
      </Field>

      {!items.length ? (
        <EmptyState
          title="No residents yet"
          detail="Invite the first resident or security officer."
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {visibleItems.map((user) => (
              <li key={user.membershipId} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{user.fullName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={statusTone(user.status)}>{user.status}</Badge>
                  <Badge>{user.role}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Gates: {user.gates.length ? user.gates.join(", ") : "—"}
                </p>
                {canAssign && user.role === "SECURITY" && (
                  <Button className="mt-3" variant="secondary" onClick={() => setAssignUser(user)}>
                    Assign gates
                  </Button>
                )}
                {canInvite && user.membershipStatus === "ACTIVE" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {user.status === "INVITED" ? (
                      <Button
                        variant="secondary"
                        disabled={
                          resendInvite.isPending && resendInvite.variables === user.membershipId
                        }
                        onClick={() => setResendUser(user)}
                      >
                        {resendInvite.isPending && resendInvite.variables === user.membershipId
                          ? "Sending…"
                          : "Resend invite"}
                      </Button>
                    ) : null}
                    <Button
                      variant="destructive"
                      disabled={revoke.isPending}
                      onClick={() => setRevokeUser(user)}
                    >
                      Revoke access
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Gates</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((user) => (
                  <tr className="border-t border-border" key={user.membershipId}>
                    <td className="px-4 py-3 font-medium">{user.fullName}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(user.status)}>{user.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">{user.gates.length ? user.gates.join(", ") : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {canAssign && user.role === "SECURITY" ? (
                          <Button variant="secondary" onClick={() => setAssignUser(user)}>
                            Assign gates
                          </Button>
                        ) : null}
                        {canInvite && user.membershipStatus === "ACTIVE" ? (
                          <>
                            {user.status === "INVITED" ? (
                              <Button
                                variant="secondary"
                                disabled={
                                  resendInvite.isPending &&
                                  resendInvite.variables === user.membershipId
                                }
                                onClick={() => setResendUser(user)}
                              >
                                {resendInvite.isPending &&
                                resendInvite.variables === user.membershipId
                                  ? "Sending…"
                                  : "Resend invite"}
                              </Button>
                            ) : null}
                            <Button
                              variant="destructive"
                              disabled={revoke.isPending}
                              onClick={() => setRevokeUser(user)}
                            >
                              Revoke access
                            </Button>
                          </>
                        ) : null}
                        {!canAssign && !(canInvite && user.membershipStatus === "ACTIVE")
                          ? "—"
                          : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length > pageSize ? (
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Page {activePage} of {pageCount} · {filteredItems.length} residents
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={activePage === 1}
                  onClick={() => setPage(activePage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={activePage === pageCount}
                  onClick={() => setPage(activePage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <InviteResidentDialog
        zoneId={zoneId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />

      <AssignSecurityGatesDialog
        zoneId={zoneId}
        open={Boolean(assignUser)}
        membershipId={assignUser?.membershipId ?? ""}
        personName={assignUser?.fullName ?? ""}
        assignedGateNames={assignUser?.gates ?? []}
        onClose={() => setAssignUser(null)}
      />
      <ConfirmDialog
        open={Boolean(revokeUser)}
        title="Revoke zone access?"
        detail={`This immediately signs ${revokeUser?.fullName ?? "this user"} out, suspends their access to this zone, and removes any gate assignments.`}
        confirmLabel="Revoke access"
        pending={revoke.isPending}
        onClose={() => setRevokeUser(null)}
        onConfirm={() => {
          if (!revokeUser) return;
          revoke.mutate(revokeUser.membershipId, { onSuccess: () => setRevokeUser(null) });
        }}
      />
      <ConfirmDialog
        open={Boolean(resendUser)}
        title="Resend activation invitation?"
        detail={`We’ll ensure an activation email is queued for ${resendUser?.email ?? "this user"}. A newly generated link replaces older activation links.`}
        confirmLabel="Send invitation"
        pending={resendInvite.isPending}
        onClose={() => setResendUser(null)}
        onConfirm={() => {
          if (!resendUser) return;
          resendInvite.mutate(resendUser.membershipId, {
            onSuccess: (result) => {
              toast(`Activation invitation queued for ${result.email}.`);
              setResendUser(null);
            },
          });
        }}
      />
    </section>
  );
}

const inviteSchema = z
  .object({
    email: z.string().email("Enter a valid email."),
    fullName: z.string().trim().min(1, "Enter the full name."),
    role: z.enum(["ZONE_ADMIN", "SECURITY", "RESIDENT"]),
    phone: z.string().optional(),
    householdId: z.string().optional(),
    householdRole: z.enum(["PRIMARY", "MEMBER", "STAFF"]).optional(),
    canInviteVisitors: z.enum(["true", "false"]).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.householdId && !values.householdRole) {
      ctx.addIssue({
        code: "custom",
        path: ["householdRole"],
        message: "Choose a household role.",
      });
    }
  });

type InviteValues = z.infer<typeof inviteSchema>;

function InviteResidentDialog({
  zoneId,
  open,
  onClose,
}: {
  zoneId: string;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const householdsQuery = useQuery({
    ...householdsQueryOptions(zoneId),
    enabled: open,
  });
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      fullName: "",
      role: "RESIDENT",
      phone: "",
      householdId: "",
      householdRole: "MEMBER",
      canInviteVisitors: "true",
    },
  });
  const role = form.watch("role");
  const householdId = form.watch("householdId");

  const invite = useInviteZoneUser(zoneId);

  function submit(values: InviteValues) {
    const phone = values.phone?.trim();
    invite.mutate(
      {
        email: values.email.trim().toLowerCase(),
        fullName: values.fullName.trim(),
        role: values.role as ZoneRole,
        phoneE164: phone ? normalizeNigerianPhone(phone) : undefined,
        householdId: values.householdId || undefined,
        householdRole: values.householdId ? values.householdRole : undefined,
        canInviteVisitors:
          values.householdId && values.canInviteVisitors
            ? values.canInviteVisitors === "true"
            : undefined,
      },
      {
        onSuccess: () => {
          toast("Invitation sent.");
          form.reset();
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} title="Invite resident" onClose={onClose}>
      <form className="space-y-3" onSubmit={form.handleSubmit(submit)}>
        <Field label="Full name" error={form.formState.errors.fullName?.message}>
          <Input {...form.register("fullName")} autoComplete="name" />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} autoComplete="email" />
        </Field>
        <Field label="Phone (optional)">
          <Input {...form.register("phone")} inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label="Zone role">
          <SelectControl
            value={form.watch("role")}
            onValueChange={(value) =>
              form.setValue("role", value as InviteValues["role"], {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            options={[
              { value: "RESIDENT", label: "Resident" },
              { value: "SECURITY", label: "Security" },
              { value: "ZONE_ADMIN", label: "Zone admin" },
            ]}
          />
        </Field>
        {role === "RESIDENT" && (
          <>
            <Field label="Household (optional)">
              <SelectControl
                value={form.watch("householdId") ?? ""}
                onValueChange={(value) =>
                  form.setValue("householdId", value, { shouldValidate: true, shouldDirty: true })
                }
                options={[
                  { value: "", label: "None yet" },
                  ...(householdsQuery.data?.items ?? []).map((household) => ({
                    value: household.id,
                    label: household.address,
                  })),
                ]}
              />
            </Field>
            {householdId ? (
              <>
                <Field label="Household role" error={form.formState.errors.householdRole?.message}>
                  <SelectControl
                    value={form.watch("householdRole") ?? "MEMBER"}
                    onValueChange={(value) =>
                      form.setValue("householdRole", value as InviteValues["householdRole"], {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    options={[
                      { value: "PRIMARY", label: "Primary" },
                      { value: "MEMBER", label: "Member" },
                      { value: "STAFF", label: "Staff" },
                    ]}
                  />
                </Field>
                <Field label="Can invite visitors">
                  <SelectControl
                    value={form.watch("canInviteVisitors") ?? "true"}
                    onValueChange={(value) =>
                      form.setValue(
                        "canInviteVisitors",
                        value as InviteValues["canInviteVisitors"],
                        { shouldValidate: true, shouldDirty: true },
                      )
                    }
                    options={[
                      { value: "true", label: "Yes" },
                      { value: "false", label: "No" },
                    ]}
                  />
                </Field>
              </>
            ) : null}
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={invite.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={invite.isPending}>
            {invite.isPending ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
