import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gateControllerAdmit } from "@/api/generated/gate/gate";
import { gateKeys } from "@/modules/gate/query-keys";

export const useAdmitVisitor = (zoneId: string, gateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      passId,
      observedPartySize,
      proof,
    }: {
      passId: string;
      observedPartySize?: number;
      proof: { method: "MANUAL"; code: string } | { method: "QR"; token: string };
    }) =>
      gateControllerAdmit(zoneId, gateId, passId, {
        ...proof,
        observedPartySize,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: gateKeys.events.all(zoneId, gateId) });
    },
  });
};
