export const householdsKeys = {
  households: {
    all: (zoneId: string) => ["zones", zoneId, "households"] as const,
  },
  members: {
    all: (zoneId: string, householdId: string) =>
      ["zones", zoneId, "households", householdId, "members"] as const,
  },
  memberRequests: {
    all: (zoneId: string) => ["zones", zoneId, "member-requests"] as const,
    mine: (zoneId: string, householdId: string) =>
      ["zones", zoneId, "households", householdId, "member-requests"] as const,
  },
};
