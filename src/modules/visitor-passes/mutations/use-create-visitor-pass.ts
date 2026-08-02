import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateVisitorPassDto } from "@/api/generated/estatelyAPI.schemas";
import { customInstance } from "@/lib/mutator";
import { visitorPassesKeys } from "@/modules/visitor-passes/query-keys";
import type { TCreatedVisitorPass } from "@/types/visitor-passes";
import { handleApiError } from "@/utils/error";

export const useCreateVisitorPass = (zoneId: string, householdId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({
      body,
      idempotencyKey,
    }: {
      body: CreateVisitorPassDto;
      idempotencyKey: string;
    }) =>
      customInstance<TCreatedVisitorPass>({
        url: `/v1/zones/${zoneId}/households/${householdId}/visitor-passes`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        data: body,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: visitorPassesKeys.passes.all(zoneId, householdId),
      });
    },
  });
};
