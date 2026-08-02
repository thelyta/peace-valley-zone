"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";
import { hasPermission, Permission } from "@/modules/auth/utils/permission";
import { zoneUsersQueryOptions } from "@/modules/residents/queries/use-fetch-zone-users";
import type { HouseholdDuesStatus, VisitorAccessOverride } from "@/types/enums";
import type { THouseholdItem } from "@/types/households";
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
import { useAddHouseholdMember } from "../mutations/use-add-household-member";
import { useCreateHousehold } from "../mutations/use-create-household";
import { useUpdateHousehold } from "../mutations/use-update-household";
import { useUpdateHouseholdMember } from "../mutations/use-update-household-member";
import { householdMembersQueryOptions } from "../queries/use-fetch-household-members";
import { useFetchHouseholds } from "../queries/use-fetch-households";

function duesTone(status: HouseholdDuesStatus) {
  switch (status) {
    case "PAID":
    case "WAIVED":
      return "good" as const;
    case "UNPAID":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function duesLabel(status: HouseholdDuesStatus) {
  return status.toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}

function visitationPolicyLabel(value: VisitorAccessOverride | string) {
  switch (value) {
    case "ALLOW":
      return "Allow visitation";
    case "BLOCK":
      return "Block visitation";
    default:
      return "Follow zone policy";
  }
}

export function HouseholdsDirectory({ zoneId }: { zoneId: string }) {
  const sessionQuery = useFetchSession();
  const query = useFetchHouseholds(zoneId);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<THouseholdItem | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<{
    household: THouseholdItem;
    value: VisitorAccessOverride;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [duesFilter, setDuesFilter] = useState("ALL");
  const [householdFilter, setHouseholdFilter] = useState("ALL");
  const [visitationFilter, setVisitationFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const toast = useToast();

  const canManage =
    sessionQuery.data != null &&
    hasPermission(sessionQuery.data, zoneId, Permission.HOUSEHOLDS_MANAGE);

  const patchOverride = useUpdateHousehold(zoneId);

  if (query.isPending) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (query.isError) {
    return <ErrorState error="Unable to load households." retry={() => void query.refetch()} />;
  }

  const items = query.data.items;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      [item.address, item.label ?? ""].some((value) => value.toLowerCase().includes(normalizedSearch));
    const matchesDues =
      duesFilter === "ALL" ||
      item.duesStatus === duesFilter;
    const matchesHousehold = householdFilter === "ALL" || item.status === householdFilter;
    const matchesVisitation =
      visitationFilter === "ALL" || item.visitorAccessOverride === visitationFilter;
    return matchesSearch && matchesDues && matchesHousehold && matchesVisitation;
  });
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const visibleItems = filteredItems.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Households</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Homes, members, visitor access, and annual dues tracking from 2026.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Icon icon={Home} size={24} />
            Create household
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search households">
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Address or label"
          />
        </Field>
        <Field label="Dues status">
          <SelectControl
            value={duesFilter}
            onValueChange={(value) => {
              setDuesFilter(value);
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "All dues statuses" },
              { value: "PAID", label: "Paid" },
              { value: "UNPAID", label: "Unpaid" },
              { value: "WAIVED", label: "Waived" },
            ]}
          />
        </Field>
        <Field label="Household status">
          <SelectControl
            value={householdFilter}
            onValueChange={(value) => {
              setHouseholdFilter(value);
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "All households" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        </Field>
        <Field label="Visitation policy">
          <SelectControl
            value={visitationFilter}
            onValueChange={(value) => {
              setVisitationFilter(value);
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "All policies" },
              { value: "INHERIT", label: "Follow zone policy" },
              { value: "ALLOW", label: "Allow visitation" },
              { value: "BLOCK", label: "Block visitation" },
            ]}
          />
        </Field>
      </div>

      {!items.length ? (
        <EmptyState
          title="No households yet"
          detail="Create the first home and its primary resident."
        />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {visibleItems.map((household) => (
              <li key={household.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{household.address}</p>
                {household.label && (
                  <p className="text-sm text-muted-foreground">{household.label}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  Primary resident: {household.primaryResident?.fullName ?? "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={duesTone(household.duesStatus)}>
                    {duesLabel(household.duesStatus)}
                  </Badge>
                  <Badge>{visitationPolicyLabel(household.visitorAccessOverride)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {household._count.memberships} members
                </p>
                {canManage && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setSelected(household)}>
                      Members
                    </Button>
                    <SelectControl
                      className="max-w-[14rem]"
                      value={household.visitorAccessOverride}
                      onValueChange={(value) =>
                        setOverrideTarget({
                          household,
                          value: value as VisitorAccessOverride,
                        })
                      }
                      options={[
                        { value: "INHERIT", label: "Follow zone policy" },
                        { value: "ALLOW", label: "Allow visitation" },
                        { value: "BLOCK", label: "Block visitation" },
                      ]}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Address</th>
                  <th className="px-4 py-3 font-semibold">Primary resident</th>
                  <th className="px-4 py-3 font-semibold">Members</th>
                  <th className="px-4 py-3 font-semibold">Dues status</th>
                  <th className="px-4 py-3 font-semibold">Visitation policy</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((household) => (
                  <tr className="border-t border-border" key={household.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{household.address}</p>
                      {household.label && (
                        <p className="text-muted-foreground">{household.label}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{household.primaryResident?.fullName ?? "—"}</td>
                    <td className="px-4 py-3">{household._count.memberships}</td>
                    <td className="px-4 py-3">
                      <Badge tone={duesTone(household.duesStatus)}>
                        {duesLabel(household.duesStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <SelectControl
                          className="max-w-[14rem]"
                          value={household.visitorAccessOverride}
                          onValueChange={(value) =>
                            setOverrideTarget({
                              household,
                              value: value as VisitorAccessOverride,
                            })
                          }
                          options={[
                            { value: "INHERIT", label: "Follow zone policy" },
                            { value: "ALLOW", label: "Allow visitation" },
                            { value: "BLOCK", label: "Block visitation" },
                          ]}
                        />
                      ) : (
                        visitationPolicyLabel(household.visitorAccessOverride)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <Button variant="secondary" onClick={() => setSelected(household)}>
                          Members
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length > pageSize ? (
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Page {activePage} of {pageCount} · {filteredItems.length} households
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

      <CreateHouseholdDialog
        zoneId={zoneId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <HouseholdMembersDialog
        zoneId={zoneId}
        household={selected}
        onClose={() => setSelected(null)}
      />

      <ConfirmDialog
        open={Boolean(overrideTarget)}
        title="Update visitation policy"
        detail={
          overrideTarget
            ? `${overrideTarget.household.address} will use “${visitationPolicyLabel(overrideTarget.value)}”.`
            : ""
        }
        confirmLabel="Update policy"
        pending={patchOverride.isPending}
        tone={overrideTarget?.value === "BLOCK" ? "danger" : "primary"}
        onClose={() => setOverrideTarget(null)}
        onConfirm={() => {
          if (!overrideTarget) {
            return;
          }
          patchOverride.mutate(
            {
              householdId: overrideTarget.household.id,
              body: { visitorAccessOverride: overrideTarget.value },
            },
            {
              onSuccess: () => {
                toast("Visitation policy updated.");
                setOverrideTarget(null);
              },
            },
          );
        }}
      />
    </section>
  );
}

const createSchema = z.object({
  address: z.string().trim().min(1, "Enter the full address."),
  label: z.string().optional(),
  fullName: z.string().trim().min(1, "Enter the resident's full name."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().optional(),
  isPrimaryResident: z.enum(["true", "false"]),
  duesStatus: z.enum(["PAID", "UNPAID"]),
});

type CreateValues = z.infer<typeof createSchema>;

function CreateHouseholdDialog({
  zoneId,
  open,
  onClose,
}: {
  zoneId: string;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      address: "",
      label: "",
      fullName: "",
      email: "",
      phone: "",
      isPrimaryResident: "true",
      duesStatus: "UNPAID",
    },
  });

  const create = useCreateHousehold(zoneId);

  return (
    <Dialog open={open} title="Create household" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit((values) =>
          create.mutate(
            {
              address: values.address.trim(),
              label: values.label?.trim() || undefined,
              fullName: values.fullName.trim(),
              email: values.email.trim().toLowerCase(),
              phoneE164: values.phone?.trim() || undefined,
              isPrimaryResident: values.isPrimaryResident === "true",
              duesStatus: values.duesStatus,
            },
            {
              onSuccess: () => {
                toast("Household created.");
                form.reset();
                onClose();
              },
            },
          ),
        )}
      >
        <Field label="Full address" error={form.formState.errors.address?.message}>
          <Input {...form.register("address")} autoComplete="street-address" />
        </Field>
        <Field label="Label (optional)">
          <Input {...form.register("label")} autoComplete="off" />
        </Field>
        <Field label="Resident full name" error={form.formState.errors.fullName?.message}>
          <Input {...form.register("fullName")} autoComplete="name" />
        </Field>
        <Field label="Resident email" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} autoComplete="email" />
        </Field>
        <Field label="Resident phone (optional)">
          <Input {...form.register("phone")} inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label="Primary resident">
          <SelectControl
            value={form.watch("isPrimaryResident")}
            onValueChange={(value) =>
              form.setValue("isPrimaryResident", value as CreateValues["isPrimaryResident"])
            }
            options={[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ]}
          />
        </Field>
        <Field label="Dues status">
          <SelectControl
            value={form.watch("duesStatus")}
            onValueChange={(value) =>
              form.setValue("duesStatus", value as CreateValues["duesStatus"])
            }
            options={[
              { value: "UNPAID", label: "Unpaid" },
              { value: "PAID", label: "Paid" },
            ]}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

const addMemberSchema = z.object({
  userId: z.string().min(1, "Choose a resident."),
  role: z.enum(["PRIMARY", "MEMBER", "STAFF"]),
  canInviteVisitors: z.enum(["true", "false"]),
});

type AddMemberValues = z.infer<typeof addMemberSchema>;

function HouseholdMembersDialog({
  zoneId,
  household,
  onClose,
}: {
  zoneId: string;
  household: THouseholdItem | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const open = Boolean(household);
  const householdId = household?.id ?? "";
  const membersQuery = useQuery({
    ...householdMembersQueryOptions(zoneId, householdId),
    enabled: open && Boolean(householdId),
  });
  const usersQuery = useQuery({
    ...zoneUsersQueryOptions(zoneId),
    enabled: open,
  });
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const form = useForm<AddMemberValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: "", role: "MEMBER", canInviteVisitors: "true" },
  });

  const add = useAddHouseholdMember(zoneId, householdId);
  const patchMember = useUpdateHouseholdMember(zoneId, householdId);

  const memberUserIds = new Set((membersQuery.data?.items ?? []).map((item) => item.userId));
  const availableUsers = (usersQuery.data?.items ?? []).filter(
    (user) => user.role === "RESIDENT" && !memberUserIds.has(user.id),
  );

  return (
    <Dialog
      open={open}
      title={household ? `Members — ${household.address}` : "Members"}
      onClose={() => {
        setAddMemberOpen(false);
        onClose();
      }}
    >
      <div className="space-y-4">
        {membersQuery.isPending ? (
          <Skeleton className="h-28 w-full" />
        ) : membersQuery.isError ? (
          <ErrorState error="Unable to load members." retry={() => void membersQuery.refetch()} />
        ) : !membersQuery.data.items.length ? (
          <EmptyState title="No members yet" />
        ) : (
          <ul className="space-y-3">
            {membersQuery.data.items.map((member) => (
              <li key={member.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{member.user.fullName}</p>
                <p className="text-muted-foreground">{member.user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{member.role}</Badge>
                  <Badge tone={member.status === "ACTIVE" ? "good" : "warning"}>
                    {member.status}
                  </Badge>
                  <Badge tone={member.canInviteVisitors ? "good" : "neutral"}>
                    {member.canInviteVisitors ? "Can invite" : "No invites"}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={patchMember.isPending}
                    onClick={() =>
                      patchMember.mutate(
                        {
                          memberId: member.id,
                          body: { canInviteVisitors: !member.canInviteVisitors },
                        },
                        { onSuccess: () => toast("Member updated.") },
                      )
                    }
                  >
                    {member.canInviteVisitors ? "Revoke invites" : "Allow invites"}
                  </Button>
                  {member.status === "ACTIVE" ? (
                    <Button
                      variant="secondary"
                      disabled={patchMember.isPending}
                      onClick={() =>
                        patchMember.mutate(
                          { memberId: member.id, body: { status: "SUSPENDED" } },
                          { onSuccess: () => toast("Member updated.") },
                        )
                      }
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      disabled={patchMember.isPending}
                      onClick={() =>
                        patchMember.mutate(
                          { memberId: member.id, body: { status: "ACTIVE" } },
                          { onSuccess: () => toast("Member updated.") },
                        )
                      }
                    >
                      Reactivate
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!addMemberOpen ? (
          <Button
            type="button"
            disabled={!availableUsers.length}
            onClick={() => setAddMemberOpen(true)}
          >
            Add member
          </Button>
        ) : (
          <form
            className="space-y-3 border-t border-border pt-4"
            onSubmit={form.handleSubmit((values) =>
              add.mutate(
                {
                  userId: values.userId,
                  role: values.role,
                  canInviteVisitors: values.canInviteVisitors === "true",
                },
                {
                  onSuccess: () => {
                    toast("Member added.");
                    form.reset({ userId: "", role: "MEMBER", canInviteVisitors: "true" });
                    setAddMemberOpen(false);
                  },
                },
              ),
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Add member</h3>
              <Button
                type="button"
                variant="secondary"
                disabled={add.isPending}
                onClick={() => setAddMemberOpen(false)}
              >
                Cancel
              </Button>
            </div>
            <Field label="Resident" error={form.formState.errors.userId?.message}>
              <SelectControl
                value={form.watch("userId")}
                onValueChange={(value) =>
                  form.setValue("userId", value, { shouldValidate: true, shouldDirty: true })
                }
                placeholder="Select resident"
                options={[
                  { value: "", label: "Select resident" },
                  ...availableUsers.map((user) => ({
                    value: user.id,
                    label: `${user.fullName} (${user.email})`,
                  })),
                ]}
              />
            </Field>
            <Field label="Role">
              <SelectControl
                value={form.watch("role")}
                onValueChange={(value) =>
                  form.setValue("role", value as AddMemberValues["role"], {
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
                value={form.watch("canInviteVisitors")}
                onValueChange={(value) =>
                  form.setValue(
                    "canInviteVisitors",
                    value as AddMemberValues["canInviteVisitors"],
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                    },
                  )
                }
                options={[
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ]}
              />
            </Field>
            <Button type="submit" disabled={add.isPending || !availableUsers.length}>
              {add.isPending ? "Adding…" : "Add member"}
            </Button>
          </form>
        )}
      </div>
    </Dialog>
  );
}
