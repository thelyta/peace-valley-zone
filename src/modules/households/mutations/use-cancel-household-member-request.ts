import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerCancelMemberRequest } from "@/api/generated/directory/directory";
import { householdsKeys } from "@/modules/households/query-keys";
import { handleApiError } from "@/utils/error";

export const useCancelHouseholdMemberRequest = (zoneId: string, householdId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (requestId: string) => directoryControllerCancelMemberRequest(zoneId, requestId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: householdsKeys.memberRequests.all(zoneId),
        }),
        householdId
          ? queryClient.invalidateQueries({
              queryKey: householdsKeys.memberRequests.mine(zoneId, householdId),
            })
          : Promise.resolve(),
      ]);
    },
  });
};
