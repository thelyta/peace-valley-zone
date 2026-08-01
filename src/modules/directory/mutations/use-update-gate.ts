import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerUpdateGate } from "@/api/generated/directory/directory";
import type { UpdateGateDto } from "@/api/generated/magodoEstateAPI.schemas";
import { directoryKeys } from "@/modules/directory/query-keys";
import { handleApiError } from "@/utils/error";

export const useUpdateGate = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({ gateId, body }: { gateId: string; body: UpdateGateDto }) =>
      directoryControllerUpdateGate(zoneId, gateId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: directoryKeys.gates.all(zoneId) });
    },
  });
};
