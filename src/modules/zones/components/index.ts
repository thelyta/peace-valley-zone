import type { ZoneMembership } from "@/types/session";

export type { TZone, TZoneSettings } from "@/types/zones";
export { useUpdateZoneSettings } from "../mutations/use-update-zone-settings";
export { useFetchZone, zoneQueryOptions } from "../queries/use-fetch-zone";
export { ZoneSettingsForm, ZoneSettingsPage } from "./settings";

export function zoneLabel(zone: ZoneMembership) {
  return `${zone.zone.name} — ${zone.estate.name}`;
}

export function accessibleZoneIds(zones: ZoneMembership[]) {
  return new Set(zones.map((zone) => zone.zoneId));
}
