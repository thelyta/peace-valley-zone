import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerSetGateStreets } from "@/api/generated/directory/directory";
import type { SetGateStreetsDto } from "@/api/generated/estatelyAPI.schemas";
import { directoryKeys } from "@/modules/directory/query-keys";
import { handleApiError } from "@/utils/error";

export const useSetGateStreets = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({ gateId, body }: { gateId: string; body: SetGateStreetsDto }) =>
      directoryControllerSetGateStreets(zoneId, gateId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: directoryKeys.gates.all(zoneId) });
    },
  });
};
