import { useMutation } from "@tanstack/react-query";
import { authControllerResend } from "@/api/generated/auth/auth";

export const useResendDeviceChallenge = () => {
  return useMutation({
    mutationFn: (challengeId: string) => authControllerResend(challengeId),
  });
};
