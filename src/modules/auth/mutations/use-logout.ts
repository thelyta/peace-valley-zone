import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authControllerLogout } from "@/api/generated/auth/auth";
import { useAppStore } from "@/lib/app.store";
import { csrf } from "@/lib/csrf";
import { handleApiError } from "@/utils/error";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearSelection = useAppStore((state) => state.clearSelection);

  return useMutation({
    onError: handleApiError,
    mutationFn: () => authControllerLogout(),
    onSettled: () => {
      csrf.set(null);
      clearSelection();
      queryClient.clear();
    },
  });
};
