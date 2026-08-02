import { useMutation } from "@tanstack/react-query";
import { authControllerActivate } from "@/api/generated/auth/auth";
import type { ActivateAccountDto } from "@/api/generated/estatelyAPI.schemas";

export const useActivateAccount = () => {
  return useMutation({
    mutationFn: (body: ActivateAccountDto) => authControllerActivate(body),
  });
};
