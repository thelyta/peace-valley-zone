import { useMutation } from "@tanstack/react-query";
import { directoryControllerResendInvite } from "@/api/generated/directory/directory";
import { handleApiError } from "@/utils/error";

export function useResendActivationInvite(zoneId: string) {
  return useMutation({
    mutationFn: (membershipId: string) => directoryControllerResendInvite(zoneId, membershipId),
    onError: handleApiError,
  });
}
