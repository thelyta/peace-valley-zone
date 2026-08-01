// Keep incomplete admin areas out of navigation while the underlying APIs remain available.
export const featureFlags = {
  adminSecurityEvents: false,
  adminStreetAndGateSettings: false,
} as const;
