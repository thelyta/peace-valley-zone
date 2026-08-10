import { useMutation } from "@tanstack/react-query";
import { visitorPassesControllerShare } from "@/api/generated/visitor-passes/visitor-passes";

export const useRevealVisitorPass = (zoneId: string, householdId: string) => {
  return useMutation({
    mutationFn: (passId: string) => visitorPassesControllerShare(zoneId, householdId, passId),
  });
};
