import { useMutation } from "@tanstack/react-query";
import { customInstance } from "@/lib/mutator";
import { handleApiError } from "@/utils/error";

type ResendActivationInviteResponse = { email: string };

export function useResendActivationInvite(zoneId: string) {
  return useMutation({
    mutationFn: (membershipId: string) =>
      customInstance<ResendActivationInviteResponse>({
        url: `/v1/zones/${zoneId}/users/${membershipId}/resend-invite`,
        method: "POST",
      }),
    onError: handleApiError,
  });
}
