import { queryOptions, useQuery } from "@tanstack/react-query";
import { gateControllerEvents } from "@/api/generated/gate/gate";
import { gateKeys } from "@/modules/gate/query-keys";

export const gateEventsQueryOptions = (zoneId: string, gateId: string) =>
  queryOptions({
    enabled: Boolean(zoneId && gateId),
    queryKey: gateKeys.events.all(zoneId, gateId),
    queryFn: () => gateControllerEvents(zoneId, gateId),
    refetchInterval: 10_000,
  });

export const useFetchGateEvents = (zoneId: string, gateId: string) => {
  return useQuery(gateEventsQueryOptions(zoneId, gateId));
};
