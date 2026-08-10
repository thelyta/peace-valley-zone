import { describe, expect, it } from "vitest";
import type { Session } from "@/types/session";
import { Permission, type Permission as PermissionValue } from "./permission";
import { routeAllowed, safeReturnTo } from "./route-access";

function session(
  role: "ZONE_ADMIN" | "SECURITY" | "RESIDENT",
  permissions: PermissionValue[],
): Session {
  return {
    user: { id: "user-1", email: "person@example.com", fullName: "Test Person" },
    csrfToken: "csrf",
    households: [],
    zones: [
      {
        membershipId: "membership-1",
        zoneId: "zone-1",
        role,
        permissions,
        gateIds: role === "SECURITY" ? ["gate-1"] : [],
        estate: {
          id: "estate-1",
          name: "Estate",
          slug: "estate",
          timezone: "Africa/Lagos",
        },
        zone: { id: "zone-1", name: "Zone 1", slug: "zone-1" },
      },
    ],
  };
}

describe("routeAllowed", () => {
  it("keeps resident, security, and admin areas separated by actor role", () => {
    expect(routeAllowed(session("RESIDENT", []), "zone-1", "/resident/visitors")).toBe(true);
    expect(routeAllowed(session("RESIDENT", []), "zone-1", "/admin/residents")).toBe(false);
    expect(routeAllowed(session("SECURITY", []), "zone-1", "/security")).toBe(true);
    expect(routeAllowed(session("SECURITY", []), "zone-1", "/resident")).toBe(false);
  });

  it("guards admin submodules with their capability", () => {
    const householdsAdmin = session("ZONE_ADMIN", [Permission.HOUSEHOLDS_MANAGE]);
    expect(routeAllowed(householdsAdmin, "zone-1", "/admin/households")).toBe(true);
    expect(routeAllowed(householdsAdmin, "zone-1", "/admin/residents")).toBe(false);
  });
});

describe("safeReturnTo", () => {
  it("accepts only known internal protected routes", () => {
    expect(safeReturnTo("/resident/visitors")).toBe("/resident/visitors");
    expect(safeReturnTo("//attacker.example/path")).toBeNull();
    expect(safeReturnTo("https://attacker.example/path")).toBeNull();
    expect(safeReturnTo("/api/auth/logout")).toBeNull();
  });
});
