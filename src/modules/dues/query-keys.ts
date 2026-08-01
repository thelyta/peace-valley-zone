export const duesKeys = {
  periods: {
    all: (zoneId: string) => ["zones", zoneId, "dues-periods"] as const,
  },
  householdDues: {
    all: (zoneId: string) => ["zones", zoneId, "household-dues"] as const,
  },
};
