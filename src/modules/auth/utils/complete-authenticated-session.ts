import type { QueryClient } from "@tanstack/react-query";
import { csrf } from "@/lib/csrf";
import { sessionQueryOptions } from "@/modules/auth/queries/use-fetch-session";
import { getDefaultRouteForZone } from "@/modules/auth/utils/permission";
import { resetIdentityState } from "@/modules/auth/utils/reset-identity-state";
import { safeReturnTo } from "@/modules/auth/utils/route-access";

export async function completeAuthenticatedSession(options: {
  csrfToken: string;
  queryClient: QueryClient;
  setActiveZoneId: (zoneId: string | null) => void;
  clearSelection: () => void;
  returnTo: string | null;
}): Promise<string> {
  await resetIdentityState(options.queryClient, options.clearSelection);
  csrf.set(options.csrfToken);
  const session = await options.queryClient.fetchQuery({
    ...sessionQueryOptions(),
    staleTime: 0,
  });
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
