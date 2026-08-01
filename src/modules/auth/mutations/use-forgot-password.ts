import { useMutation } from "@tanstack/react-query";
import { authControllerForgot } from "@/api/generated/auth/auth";
import type { ForgotPasswordDto } from "@/api/generated/magodoEstateAPI.schemas";

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (body: ForgotPasswordDto) => authControllerForgot(body),
  });
};
