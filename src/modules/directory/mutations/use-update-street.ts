import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerUpdateStreet } from "@/api/generated/directory/directory";
import type { UpdateStreetDto } from "@/api/generated/estatelyAPI.schemas";
import { directoryKeys } from "@/modules/directory/query-keys";
import { handleApiError } from "@/utils/error";

export const useUpdateStreet = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({ streetId, body }: { streetId: string; body: UpdateStreetDto }) =>
      directoryControllerUpdateStreet(zoneId, streetId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: directoryKeys.streets.all(zoneId) });
    },
  });
};
