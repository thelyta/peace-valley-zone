import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duesControllerAssess } from "@/api/generated/dues/dues";
import { duesKeys } from "@/modules/dues/query-keys";
import { handleApiError } from "@/utils/error";

export const useAssessHouseholds = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (periodId: string) => duesControllerAssess(zoneId, periodId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: duesKeys.householdDues.all(zoneId) });
    },
  });
};
