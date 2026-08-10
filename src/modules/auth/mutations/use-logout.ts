import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authControllerLogout } from "@/api/generated/auth/auth";
import { useAppStore } from "@/lib/app.store";
import { resetIdentityState } from "@/modules/auth/utils/reset-identity-state";
import { handleApiError } from "@/utils/error";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearSelection = useAppStore((state) => state.clearSelection);

  return useMutation({
    onError: handleApiError,
    mutationFn: async () => {
      try {
        return await authControllerLogout();
      } finally {
        await resetIdentityState(queryClient, clearSelection);
      }
    },
  });
};
