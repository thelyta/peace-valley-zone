import { useMutation, useQueryClient } from "@tanstack/react-query";
import { visitorPassesControllerCancel } from "@/api/generated/visitor-passes/visitor-passes";
import { visitorPassesKeys } from "@/modules/visitor-passes/query-keys";
import { handleApiError } from "@/utils/error";

export const useCancelVisitorPass = (zoneId: string, householdId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (passId: string) => visitorPassesControllerCancel(zoneId, passId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: visitorPassesKeys.passes.all(zoneId, householdId),
      });
    },
  });
};
