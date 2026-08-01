import { announcementsKeys } from "@/modules/announcements/query-keys";
import { authKeys } from "@/modules/auth/query-keys";
import { directoryKeys } from "@/modules/directory/query-keys";
import { duesKeys } from "@/modules/dues/query-keys";
import { gateKeys } from "@/modules/gate/query-keys";
import { householdsKeys } from "@/modules/households/query-keys";
import { reportsKeys } from "@/modules/reports/query-keys";
import { residentsKeys } from "@/modules/residents/query-keys";
import { visitorPassesKeys } from "@/modules/visitor-passes/query-keys";
import { zonesKeys } from "@/modules/zones/query-keys";

/** Compatibility facade — prefer module `*Keys` in new code. */
export const zoneKeys = {
  all: ["zones"] as const,
  detail: (zoneId: string) => zonesKeys.detail.all(zoneId),
  session: authKeys.session,
  sessions: authKeys.sessions,
  myGates: (zoneId: string) => gateKeys.myGates.all(zoneId),
  streets: (zoneId: string) => directoryKeys.streets.all(zoneId),
  gates: (zoneId: string) => directoryKeys.gates.all(zoneId),
  households: (zoneId: string) => householdsKeys.households.all(zoneId),
  householdMembers: (zoneId: string, householdId: string) =>
    householdsKeys.members.all(zoneId, householdId),
  users: (zoneId: string) => residentsKeys.users.all(zoneId),
  duesPeriods: (zoneId: string) => duesKeys.periods.all(zoneId),
  householdDues: (zoneId: string) => duesKeys.householdDues.all(zoneId),
  visitors: (zoneId: string, householdId: string) =>
    visitorPassesKeys.passes.all(zoneId, householdId),
  entryGates: (zoneId: string, householdId: string) =>
    visitorPassesKeys.entryGates.all(zoneId, householdId),
  visitorEligibility: (zoneId: string, householdId: string) =>
    visitorPassesKeys.eligibility.all(zoneId, householdId),
  announcements: (zoneId: string) => announcementsKeys.all(zoneId),
  gateEvents: (zoneId: string, gateId: string) => gateKeys.events.all(zoneId, gateId),
  reportSummary: (zoneId: string) => reportsKeys.summary.all(zoneId),
  visitorReport: (zoneId: string, filters: Record<string, string | number | undefined>) =>
    reportsKeys.visitors.list(zoneId, filters),
  securityEventsReport: (zoneId: string, filters: Record<string, string | number | undefined>) =>
    reportsKeys.securityEvents.list(zoneId, filters),
};
