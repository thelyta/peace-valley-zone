import { Permission } from "@/types/enums";
import type { Session } from "@/types/session";
import {
  canAccessAdminArea,
  canAccessResidentArea,
  canAccessSecurityArea,
  hasPermission,
} from "./permission";

const protectedPrefixes = ["/resident", "/security", "/admin", "/select-zone"];

export function safeReturnTo(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return protectedPrefixes.some((prefix) => value === prefix || value.startsWith(`${prefix}/`))
    ? value
    : null;
}

export function routeAllowed(session: Session, zoneId: string | null, pathname: string) {
  if (pathname === "/select-zone") {
    return true;
  }
  if (!zoneId) {
    return false;
  }

  if (pathname.startsWith("/security")) {
    return canAccessSecurityArea(session, zoneId);
  }

  if (pathname.startsWith("/admin")) {
    if (!canAccessAdminArea(session, zoneId)) {
      return false;
    }
    if (pathname === "/admin" || pathname === "/admin/") {
      return true;
    }
    if (pathname.startsWith("/admin/residents")) {
      return hasPermission(session, zoneId, Permission.USERS_MANAGE);
    }
    if (pathname.startsWith("/admin/households") || pathname.startsWith("/admin/member-requests")) {
      return hasPermission(session, zoneId, Permission.HOUSEHOLDS_MANAGE);
    }
    if (pathname.startsWith("/admin/announcements")) {
      return hasPermission(session, zoneId, Permission.ANNOUNCEMENTS_MANAGE);
    }
    if (pathname.startsWith("/admin/visitation") || pathname.startsWith("/admin/security-events")) {
      return hasPermission(session, zoneId, Permission.REPORTS_VISITORS_READ);
    }
    if (pathname.startsWith("/admin/settings")) {
      return (
        hasPermission(session, zoneId, Permission.ZONE_SETTINGS_WRITE) ||
        hasPermission(session, zoneId, Permission.STREETS_MANAGE) ||
        hasPermission(session, zoneId, Permission.GATES_MANAGE) ||
        hasPermission(session, zoneId, Permission.SECURITY_ASSIGN)
      );
    }
    return true;
  }

  if (pathname.startsWith("/resident")) {
    return canAccessResidentArea(session, zoneId);
  }

  return true;
}
