import { useMutation } from "@tanstack/react-query";
import { authControllerRequestActivationInvite } from "@/api/generated/auth/auth";
import type { RequestActivationInviteDto } from "@/api/generated/estatelyAPI.schemas";

export function useRequestActivationInvite() {
  return useMutation({
    mutationFn: (body: RequestActivationInviteDto) => authControllerRequestActivationInvite(body),
  });
}
