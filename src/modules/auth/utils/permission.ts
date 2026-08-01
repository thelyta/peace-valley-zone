import { Permission, type ZoneRole } from "@/types/enums";
import type { Session } from "@/types/session";

export { Permission };

export function getZoneRole(session: Session, zoneId: string): ZoneRole | null {
  return session.zones.find((membership) => membership.zoneId === zoneId)?.role ?? null;
}

export function hasPermission(session: Session, zoneId: string, permission: Permission | string) {
  return (
    session.zones
      .find((membership) => membership.zoneId === zoneId)
      ?.permissions.includes(permission) ?? false
  );
}

export function hasAnyPermission(
  session: Session,
  zoneId: string,
  permissions: Array<Permission | string>,
) {
  return permissions.some((permission) => hasPermission(session, zoneId, permission));
}

export function hasHouseholdCapability(
  session: Session,
  householdId: string,
  capability: "visitor.create",
) {
  const membership = session.households.find((item) => item.householdId === householdId);
  return capability === "visitor.create" && membership?.canInviteVisitors === true;
}

export function canAccessResidentArea(session: Session, zoneId: string) {
  return getZoneRole(session, zoneId) === "RESIDENT";
}

export function canAccessSecurityArea(session: Session, zoneId: string) {
  return getZoneRole(session, zoneId) === "SECURITY";
}

export function canAccessAdminArea(session: Session, zoneId: string) {
  return getZoneRole(session, zoneId) === "ZONE_ADMIN";
}

export function getDefaultRouteForZone(session: Session, zoneId: string) {
  const role = getZoneRole(session, zoneId);
  if (role === "ZONE_ADMIN") {
    return "/admin";
  }
  if (role === "SECURITY") {
    return "/security";
  }
  return "/resident";
}
