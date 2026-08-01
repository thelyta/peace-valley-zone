import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerCreateStreet } from "@/api/generated/directory/directory";
import type { CreateStreetDto } from "@/api/generated/magodoEstateAPI.schemas";
import { directoryKeys } from "@/modules/directory/query-keys";
import { handleApiError } from "@/utils/error";

export const useCreateStreet = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (body: CreateStreetDto) => directoryControllerCreateStreet(zoneId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: directoryKeys.streets.all(zoneId) });
    },
  });
};
