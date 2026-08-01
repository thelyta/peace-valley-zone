import { useMutation } from "@tanstack/react-query";
import { authControllerLogin } from "@/api/generated/auth/auth";
import type { LoginDto } from "@/api/generated/magodoEstateAPI.schemas";

export const useLogin = () => {
  return useMutation({
    mutationFn: (body: LoginDto) => authControllerLogin(body),
  });
};
