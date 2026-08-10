import { useMutation } from "@tanstack/react-query";
import { customInstance } from "@/lib/mutator";

type RequestActivationInviteDto = { email: string };
type RequestActivationInviteResponse = { message: string };

export function useRequestActivationInvite() {
  return useMutation({
    mutationFn: (body: RequestActivationInviteDto) =>
      customInstance<RequestActivationInviteResponse>({
        url: "/v1/auth/account/invitation/resend",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: body,
      }),
  });
}
