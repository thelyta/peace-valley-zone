import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerUpdateHouseholdDues } from "@/api/generated/directory/directory";
import type { UpdateHouseholdDuesDtoStatus } from "@/api/generated/estatelyAPI.schemas";
import { householdsKeys } from "@/modules/households/query-keys";
import { visitorPassesKeys } from "@/modules/visitor-passes/query-keys";
import { handleApiError } from "@/utils/error";

export function useUpdateHouseholdDues(zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      householdId,
      status,
    }: {
      householdId: string;
      status: UpdateHouseholdDuesDtoStatus;
    }) => directoryControllerUpdateHouseholdDues(zoneId, householdId, { status }),
    onError: handleApiError,
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: householdsKeys.households.all(zoneId) }),
        queryClient.invalidateQueries({
          queryKey: visitorPassesKeys.eligibility.all(zoneId, variables.householdId),
        }),
      ]);
    },
  });
}
