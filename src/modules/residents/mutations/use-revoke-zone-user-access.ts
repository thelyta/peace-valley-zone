import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client";
import { residentsKeys } from "../query-keys";

export function useRevokeZoneUserAccess(zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) =>
      api.post<{ ok: true }>(`/v1/zones/${zoneId}/users/${membershipId}/revoke-access`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: residentsKeys.users.all(zoneId) });
    },
  });
}
