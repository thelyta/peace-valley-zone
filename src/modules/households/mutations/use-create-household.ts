import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerCreateHousehold } from "@/api/generated/directory/directory";
import type { CreateHouseholdDto } from "@/api/generated/estatelyAPI.schemas";
import { householdsKeys } from "@/modules/households/query-keys";
import { handleApiError } from "@/utils/error";

export const useCreateHousehold = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (body: CreateHouseholdDto) => directoryControllerCreateHousehold(zoneId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: householdsKeys.households.all(zoneId) });
    },
  });
};
