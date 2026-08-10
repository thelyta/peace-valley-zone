import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerRevokeUserAccess } from "@/api/generated/directory/directory";
import { residentsKeys } from "../query-keys";

export function useRevokeZoneUserAccess(zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => directoryControllerRevokeUserAccess(zoneId, membershipId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: residentsKeys.users.all(zoneId) });
    },
  });
}
