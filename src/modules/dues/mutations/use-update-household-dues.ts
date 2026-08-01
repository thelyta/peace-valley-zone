import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duesControllerPatchDues } from "@/api/generated/dues/dues";
import type { UpdateHouseholdDuesDto } from "@/api/generated/magodoEstateAPI.schemas";
import { duesKeys } from "@/modules/dues/query-keys";
import { handleApiError } from "@/utils/error";

export const useUpdateHouseholdDues = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({ duesId, body }: { duesId: string; body: UpdateHouseholdDuesDto }) =>
      duesControllerPatchDues(zoneId, duesId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: duesKeys.householdDues.all(zoneId) });
    },
  });
};
