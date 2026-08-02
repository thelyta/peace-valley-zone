import { useMutation, useQueryClient } from "@tanstack/react-query";
import { directoryControllerInvite } from "@/api/generated/directory/directory";
import type { InviteUserDto } from "@/api/generated/estatelyAPI.schemas";
import { householdsKeys } from "@/modules/households/query-keys";
import { residentsKeys } from "@/modules/residents/query-keys";
import { handleApiError } from "@/utils/error";

export const useInviteZoneUser = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (body: InviteUserDto) => directoryControllerInvite(zoneId, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: residentsKeys.users.all(zoneId) }),
        queryClient.invalidateQueries({ queryKey: householdsKeys.households.all(zoneId) }),
      ]);
    },
  });
};
