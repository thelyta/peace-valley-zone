import { featureFlags } from "@/lib/feature-flags";
import { Permission } from "@/types/enums";
import type { Session } from "@/types/session";
import {
  canAccessAdminArea,
  canAccessResidentArea,
  canAccessSecurityArea,
  hasPermission,
} from "./permission";

export type NavItem = {
  href: string;
  label: string;
  visible: boolean;
};

export function primaryNavItems(session: Session, zoneId: string): NavItem[] {
  return [
    {
      href: "/resident",
      label: "Home",
      visible: canAccessResidentArea(session, zoneId),
    },
    {
      href: "/security",
      label: "Gate",
      visible: canAccessSecurityArea(session, zoneId),
    },
    {
      href: "/admin",
      label: "Admin",
      visible: canAccessAdminArea(session, zoneId),
    },
  ].filter((item) => item.visible);
}

export function adminNavItems(session: Session, zoneId: string): NavItem[] {
  if (!canAccessAdminArea(session, zoneId)) {
    return [];
  }

  return [
    {
      href: "/admin",
      label: "Overview",
      visible: true,
    },
    {
      href: "/admin/households",
      label: "Homes",
      visible: hasPermission(session, zoneId, Permission.HOUSEHOLDS_MANAGE),
    },
    {
      href: "/admin/member-requests",
      label: "Member requests",
      visible: hasPermission(session, zoneId, Permission.HOUSEHOLDS_MANAGE),
    },
    {
      href: "/admin/dues",
      label: "Dues",
      visible: hasPermission(session, zoneId, Permission.DUES_MANAGE),
    },
    {
      href: "/admin/announcements",
      label: "Announcements",
      visible: hasPermission(session, zoneId, Permission.ANNOUNCEMENTS_MANAGE),
    },
    {
      href: "/admin/visitation",
      label: "Visitation",
      visible: hasPermission(session, zoneId, Permission.REPORTS_VISITORS_READ),
    },
    {
      href: "/admin/security-events",
      label: "Security events",
      visible:
        featureFlags.adminSecurityEvents &&
        hasPermission(session, zoneId, Permission.REPORTS_VISITORS_READ),
    },
    {
      href: "/admin/settings",
      label: "Settings",
      visible:
        hasPermission(session, zoneId, Permission.ZONE_SETTINGS_WRITE) ||
        hasPermission(session, zoneId, Permission.STREETS_MANAGE) ||
        hasPermission(session, zoneId, Permission.GATES_MANAGE) ||
        hasPermission(session, zoneId, Permission.SECURITY_ASSIGN),
    },
  ].filter((item) => item.visible);
}

export function residentNavItems(session: Session, zoneId: string): NavItem[] {
  if (!canAccessResidentArea(session, zoneId)) {
    return [];
  }

  const hasHousehold = session.households.some((household) => household.zoneId === zoneId);
  if (!hasHousehold) {
    return [];
  }

  return [
    { href: "/resident", label: "Invite", visible: true },
    { href: "/resident/announcements", label: "Announcements", visible: true },
    { href: "/resident/household", label: "My home", visible: true },
    { href: "/resident/sessions", label: "Settings", visible: true },
  ];
}
