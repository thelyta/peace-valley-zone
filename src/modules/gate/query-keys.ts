export const gateKeys = {
  myGates: {
    all: (zoneId: string) => ["zones", zoneId, "my-gates"] as const,
  },
  events: {
    all: (zoneId: string, gateId: string) => ["zones", zoneId, "gates", gateId, "events"] as const,
  },
};
