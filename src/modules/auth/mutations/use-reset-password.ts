import { useMutation } from "@tanstack/react-query";
import { authControllerReset } from "@/api/generated/auth/auth";
import type { ResetPasswordDto } from "@/api/generated/magodoEstateAPI.schemas";

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (body: ResetPasswordDto) => authControllerReset(body),
  });
};
