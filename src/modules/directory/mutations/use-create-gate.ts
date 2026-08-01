import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerCreateGate } from "@/api/generated/directory/directory";
import type { CreateGateDto } from "@/api/generated/magodoEstateAPI.schemas";
import { directoryKeys } from "@/modules/directory/query-keys";
import { handleApiError } from "@/utils/error";

export const useCreateGate = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (body: CreateGateDto) => directoryControllerCreateGate(zoneId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: directoryKeys.gates.all(zoneId) });
    },
  });
};
