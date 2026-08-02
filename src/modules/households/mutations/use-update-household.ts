import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerUpdateHousehold } from "@/api/generated/directory/directory";
import type { UpdateHouseholdDto } from "@/api/generated/estatelyAPI.schemas";
import { householdsKeys } from "@/modules/households/query-keys";
import { handleApiError } from "@/utils/error";

export const useUpdateHousehold = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({ householdId, body }: { householdId: string; body: UpdateHouseholdDto }) =>
      directoryControllerUpdateHousehold(zoneId, householdId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: householdsKeys.households.all(zoneId) });
    },
  });
};
