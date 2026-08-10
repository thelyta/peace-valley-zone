import type {
  AddHouseholdMemberDtoRole,
  AnnouncementResponseDtoOutputStatus,
  InviteUserDtoRole,
  ListGateEventsResponseDtoOutputItemsItemResult,
  ListVisitorPassesResponseDtoOutputItemsItemStatus,
  ListZoneUsersResponseDtoOutputItemsItemMembershipStatus,
  ListZoneUsersResponseDtoOutputItemsItemStatus,
  SessionResponseDtoOutputZonesItemPermissionsItem as PermissionValue,
  UpdateGateDtoStatus,
  UpdateHouseholdDtoStatus,
  UpdateHouseholdDtoVisitorAccessOverride,
  UpdateHouseholdDuesDtoStatus,
  UpdateZoneSettingsDtoDuesGatePolicy,
} from "@/api/generated/estatelyAPI.schemas";
import { SessionResponseDtoOutputZonesItemPermissionsItem as GeneratedPermission } from "@/api/generated/estatelyAPI.schemas";

export type ZoneRole = InviteUserDtoRole;
export type MembershipStatus = ListZoneUsersResponseDtoOutputItemsItemMembershipStatus;
export type HouseholdMemberRole = AddHouseholdMemberDtoRole;
export type UserStatus = ListZoneUsersResponseDtoOutputItemsItemStatus;
export type GateStatus = UpdateGateDtoStatus;
export type HouseholdStatus = UpdateHouseholdDtoStatus;
export type VisitorAccessOverride = UpdateHouseholdDtoVisitorAccessOverride;
export type HouseholdDuesStatus = UpdateHouseholdDuesDtoStatus;
export type DuesGatePolicy = UpdateZoneSettingsDtoDuesGatePolicy;
export type VisitorPassStatus = ListVisitorPassesResponseDtoOutputItemsItemStatus | "EXPIRED";
export type GateVerificationResult = ListGateEventsResponseDtoOutputItemsItemResult;
export type AnnouncementStatus = AnnouncementResponseDtoOutputStatus;

export const Permission = {
  ZONE_SETTINGS_WRITE: GeneratedPermission.zonesettingswrite,
  STREETS_MANAGE: GeneratedPermission.streetsmanage,
  GATES_MANAGE: GeneratedPermission.gatesmanage,
  HOUSEHOLDS_MANAGE: GeneratedPermission.householdsmanage,
  USERS_MANAGE: GeneratedPermission.usersmanage,
  SECURITY_ASSIGN: GeneratedPermission.securityassign,
  ANNOUNCEMENTS_MANAGE: GeneratedPermission.announcementsmanage,
  ANNOUNCEMENTS_READ: GeneratedPermission.announcementsread,
  VISITOR_CREATE: GeneratedPermission.visitorcreate,
  VISITOR_CANCEL_OWN: GeneratedPermission.visitorcancelown,
  VISITOR_CANCEL_ZONE: GeneratedPermission.visitorcancelzone,
  VISITOR_ADMIT: GeneratedPermission.visitoradmit,
  VISITOR_VERIFY: GeneratedPermission.visitorverify,
  REPORTS_VISITORS_READ: GeneratedPermission.reportsvisitorsread,
  REPORTS_EXPORT: GeneratedPermission.reportsexport,
  SESSIONS_REVOKE_ZONE: GeneratedPermission.sessionsrevokezone,
} as const;

export type Permission = PermissionValue;
