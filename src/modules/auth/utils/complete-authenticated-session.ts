import type { QueryClient } from "@tanstack/react-query";
import { csrf } from "@/lib/csrf";
import { sessionQueryOptions } from "@/modules/auth/queries/use-fetch-session";
import { getDefaultRouteForZone } from "@/modules/auth/utils/permission";
import { safeReturnTo } from "@/modules/auth/utils/route-access";

export async function completeAuthenticatedSession(options: {
  csrfToken: string;
  queryClient: QueryClient;
  setActiveZoneId: (zoneId: string | null) => void;
  returnTo: string | null;
}): Promise<string> {
  csrf.set(options.csrfToken);
  const session = await options.queryClient.fetchQuery(sessionQueryOptions());
  const singleZone = session.zones.length === 1 ? session.zones[0] : undefined;

  if (singleZone) {
    options.setActiveZoneId(singleZone.zoneId);
  }

  const preferred = safeReturnTo(options.returnTo);
  if (preferred) {
    return preferred;
  }

  if (singleZone) {
    return getDefaultRouteForZone(session, singleZone.zoneId);
  }

  return "/select-zone";
}
