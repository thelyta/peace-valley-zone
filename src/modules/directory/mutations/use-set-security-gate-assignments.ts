import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerAssignments } from "@/api/generated/directory/directory";
import type { SetSecurityGateAssignmentsDto } from "@/api/generated/magodoEstateAPI.schemas";
import { residentsKeys } from "@/modules/residents/query-keys";
import { handleApiError } from "@/utils/error";

export const useSetSecurityGateAssignments = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({
      membershipId,
      body,
    }: {
      membershipId: string;
      body: SetSecurityGateAssignmentsDto;
    }) => directoryControllerAssignments(zoneId, membershipId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: residentsKeys.users.all(zoneId) });
    },
  });
};
