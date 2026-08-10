import { useFetchSession } from "@/modules/auth/queries/use-fetch-session";

export function useEstateTimezone(zoneId: string) {
  const session = useFetchSession();
  return session.data?.zones.find((zone) => zone.zoneId === zoneId)?.estate.timezone;
}
