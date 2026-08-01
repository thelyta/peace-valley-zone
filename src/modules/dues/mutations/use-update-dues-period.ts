import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duesControllerPatchPeriod } from "@/api/generated/dues/dues";
import type { UpdateDuesPeriodDto } from "@/api/generated/magodoEstateAPI.schemas";
import { duesKeys } from "@/modules/dues/query-keys";
import { handleApiError } from "@/utils/error";

export const useUpdateDuesPeriod = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({ periodId, body }: { periodId: string; body: UpdateDuesPeriodDto }) =>
      duesControllerPatchPeriod(zoneId, periodId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: duesKeys.periods.all(zoneId) });
    },
  });
};
