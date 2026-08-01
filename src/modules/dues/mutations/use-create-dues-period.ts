import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duesControllerCreatePeriod } from "@/api/generated/dues/dues";
import type { CreateDuesPeriodDto } from "@/api/generated/magodoEstateAPI.schemas";
import { duesKeys } from "@/modules/dues/query-keys";
import { handleApiError } from "@/utils/error";

export const useCreateDuesPeriod = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (body: CreateDuesPeriodDto) => duesControllerCreatePeriod(zoneId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: duesKeys.periods.all(zoneId) });
    },
  });
};
