import { useMutation } from "@tanstack/react-query";
import { gateControllerVerify } from "@/api/generated/gate/gate";
import { isQrPayload } from "@/modules/gate/utils/scan";

export const useVerifyVisitor = (zoneId: string, gateId: string) => {
  return useMutation({
    mutationFn: (payload: string) => {
      const trimmed = payload.trim();
      const qr = isQrPayload(trimmed);
      return gateControllerVerify(zoneId, gateId, {
        method: qr ? "QR" : "MANUAL",
        ...(qr ? { token: trimmed } : { code: trimmed }),
      });
    },
  });
};
