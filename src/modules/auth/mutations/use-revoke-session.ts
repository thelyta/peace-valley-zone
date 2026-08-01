import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authControllerRevokeOne } from "@/api/generated/auth/auth";
import { authKeys } from "@/modules/auth/query-keys";
import { handleApiError } from "@/utils/error";

export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (sessionId: string) => authControllerRevokeOne(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.sessions });
    },
  });
};
