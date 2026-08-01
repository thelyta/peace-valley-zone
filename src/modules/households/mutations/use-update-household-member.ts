import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerUpdateMember } from "@/api/generated/directory/directory";
import type { UpdateHouseholdMemberDto } from "@/api/generated/magodoEstateAPI.schemas";
import { householdsKeys } from "@/modules/households/query-keys";
import { handleApiError } from "@/utils/error";

export const useUpdateHouseholdMember = (zoneId: string, householdId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({ memberId, body }: { memberId: string; body: UpdateHouseholdMemberDto }) =>
      directoryControllerUpdateMember(zoneId, householdId, memberId, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: householdsKeys.members.all(zoneId, householdId),
        }),
        queryClient.invalidateQueries({ queryKey: householdsKeys.households.all(zoneId) }),
      ]);
    },
  });
};
