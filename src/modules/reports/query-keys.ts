export const reportsKeys = {
  summary: {
    all: (zoneId: string) => ["zones", zoneId, "reports", "summary"] as const,
  },
  visitors: {
    list: (zoneId: string, filters: Record<string, string | number | undefined>) =>
      ["zones", zoneId, "reports", "visitors", filters] as const,
  },
  securityEvents: {
    list: (zoneId: string, filters: Record<string, string | number | undefined>) =>
      ["zones", zoneId, "reports", "security-events", filters] as const,
  },
};
