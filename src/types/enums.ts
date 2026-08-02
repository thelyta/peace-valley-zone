export type ZoneRole = "ZONE_ADMIN" | "SECURITY" | "RESIDENT";
export type MembershipStatus = "ACTIVE" | "SUSPENDED" | "ENDED";
export type HouseholdMemberRole = "PRIMARY" | "MEMBER" | "STAFF";
export type UserStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type GateStatus = "ACTIVE" | "INACTIVE";
export type HouseholdStatus = "ACTIVE" | "INACTIVE";
export type VisitorAccessOverride = "INHERIT" | "ALLOW" | "BLOCK";
export type HouseholdDuesStatus = "UNPAID" | "PAID" | "WAIVED";
export type DuesGatePolicy = "BLOCK_IF_NOT_ELIGIBLE" | "ALLOW_ALWAYS";
export type VisitorPassStatus = "PENDING" | "USED" | "CANCELLED" | "EXPIRED";
export type GateVerificationResult =
  | "VALID"
  | "ADMITTED"
  | "INVALID"
  | "EXPIRED"
  | "ALREADY_USED"
  | "CANCELLED"
  | "DENIED"
  | "WRONG_GATE";
export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export const Permission = {
  ZONE_SETTINGS_WRITE: "zone.settings.write",
  STREETS_MANAGE: "streets.manage",
  GATES_MANAGE: "gates.manage",
  HOUSEHOLDS_MANAGE: "households.manage",
  USERS_MANAGE: "users.manage",
  SECURITY_ASSIGN: "security.assign",
  ANNOUNCEMENTS_MANAGE: "announcements.manage",
  ANNOUNCEMENTS_READ: "announcements.read",
  VISITOR_CREATE: "visitor.create",
  VISITOR_CANCEL_OWN: "visitor.cancel.own",
  VISITOR_CANCEL_ZONE: "visitor.cancel.zone",
  VISITOR_ADMIT: "visitor.admit",
  VISITOR_VERIFY: "visitor.verify",
  REPORTS_VISITORS_READ: "reports.visitors.read",
  REPORTS_EXPORT: "reports.export",
  SESSIONS_REVOKE_ZONE: "sessions.revoke.zone",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
