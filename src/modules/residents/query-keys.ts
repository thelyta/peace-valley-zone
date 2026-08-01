export const residentsKeys = {
  users: {
    all: (zoneId: string) => ["zones", zoneId, "users"] as const,
  },
};
