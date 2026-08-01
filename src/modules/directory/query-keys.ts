export const directoryKeys = {
  streets: {
    all: (zoneId: string) => ["zones", zoneId, "streets"] as const,
  },
  gates: {
    all: (zoneId: string) => ["zones", zoneId, "gates"] as const,
  },
};
