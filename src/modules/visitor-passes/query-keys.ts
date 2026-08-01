export const visitorPassesKeys = {
  entryGates: {
    all: (zoneId: string, householdId: string) =>
      ["zones", zoneId, "households", householdId, "entry-gates"] as const,
  },
  eligibility: {
    all: (zoneId: string, householdId: string) =>
      ["zones", zoneId, "households", householdId, "visitor-eligibility"] as const,
  },
  passes: {
    all: (zoneId: string, householdId: string) =>
      ["zones", zoneId, "households", householdId, "visitor-passes"] as const,
  },
};
