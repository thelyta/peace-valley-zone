import { useMutation } from "@tanstack/react-query";
import { authControllerVerifyDevice } from "@/api/generated/auth/auth";
import type { VerifyDeviceDto } from "@/api/generated/estatelyAPI.schemas";

export const useVerifyDevice = () => {
  return useMutation({
    mutationFn: (input: { challengeId: string; code: string }) => {
      const body: VerifyDeviceDto = { code: input.code };
      return authControllerVerifyDevice(input.challengeId, body);
    },
  });
};
