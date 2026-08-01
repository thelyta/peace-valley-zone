export const announcementsKeys = {
  all: (zoneId: string) => ["zones", zoneId, "announcements"] as const,
};
