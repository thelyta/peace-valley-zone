import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authControllerRevokeOthers } from "@/api/generated/auth/auth";
import { authKeys } from "@/modules/auth/query-keys";
import { handleApiError } from "@/utils/error";

export const useRevokeOtherSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: () => authControllerRevokeOthers(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.sessions });
    },
  });
};
