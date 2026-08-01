import { useMutation } from "@tanstack/react-query";
import { customInstance } from "@/lib/mutator";
import type { TCreatedVisitorPass } from "@/types/visitor-passes";

export const useRevealVisitorPass = (zoneId: string, householdId: string) => {
  return useMutation({
    mutationFn: (passId: string) =>
      customInstance<TCreatedVisitorPass>({
        url: `/v1/zones/${zoneId}/households/${householdId}/visitor-passes/${passId}/share`,
        method: "GET",
      }),
  });
};
