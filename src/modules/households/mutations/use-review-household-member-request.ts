import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  directoryControllerApproveMemberRequest,
  directoryControllerRejectMemberRequest,
} from "@/api/generated/directory/directory";
import type { ReviewHouseholdMemberRequestDto } from "@/api/generated/magodoEstateAPI.schemas";
import { householdsKeys } from "@/modules/households/query-keys";
import { handleApiError } from "@/utils/error";

export const useApproveHouseholdMemberRequest = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({
      requestId,
      body = {},
    }: {
      requestId: string;
      body?: ReviewHouseholdMemberRequestDto;
    }) => directoryControllerApproveMemberRequest(zoneId, requestId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: householdsKeys.memberRequests.all(zoneId),
      });
    },
  });
};

export const useRejectHouseholdMemberRequest = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: ({
      requestId,
      body = {},
    }: {
      requestId: string;
      body?: ReviewHouseholdMemberRequestDto;
    }) => directoryControllerRejectMemberRequest(zoneId, requestId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: householdsKeys.memberRequests.all(zoneId),
      });
    },
  });
};
