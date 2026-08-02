import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerRequestMember } from "@/api/generated/directory/directory";
import type { CreateHouseholdMemberRequestDto } from "@/api/generated/estatelyAPI.schemas";
import { householdsKeys } from "@/modules/households/query-keys";
import { handleApiError } from "@/utils/error";

export const useRequestHouseholdMember = (zoneId: string, householdId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (body: CreateHouseholdMemberRequestDto) =>
      directoryControllerRequestMember(zoneId, householdId, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: householdsKeys.memberRequests.all(zoneId),
        }),
        queryClient.invalidateQueries({
          queryKey: householdsKeys.memberRequests.mine(zoneId, householdId),
        }),
      ]);
    },
  });
};
