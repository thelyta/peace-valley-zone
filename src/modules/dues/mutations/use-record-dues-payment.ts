import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duesControllerPayment } from "@/api/generated/dues/dues";
import type { RecordDuesPaymentDto } from "@/api/generated/magodoEstateAPI.schemas";
import { duesKeys } from "@/modules/dues/query-keys";
import { handleApiError } from "@/utils/error";

export const useRecordDuesPayment = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({ duesId, body }: { duesId: string; body: RecordDuesPaymentDto }) =>
      duesControllerPayment(zoneId, duesId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: duesKeys.householdDues.all(zoneId) });
    },
  });
};
