import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerAddMember } from "@/api/generated/directory/directory";
import type { AddHouseholdMemberDto } from "@/api/generated/estatelyAPI.schemas";
import { householdsKeys } from "@/modules/households/query-keys";
import { handleApiError } from "@/utils/error";

export const useAddHouseholdMember = (zoneId: string, householdId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (body: AddHouseholdMemberDto) =>
      directoryControllerAddMember(zoneId, householdId, body),
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
