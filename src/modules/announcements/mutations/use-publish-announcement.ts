import { useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsControllerPublish } from "@/api/generated/announcements/announcements";
import { announcementsKeys } from "@/modules/announcements/query-keys";
import { handleApiError } from "@/utils/error";

export const usePublishAnnouncement = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (id: string) => announcementsControllerPublish(zoneId, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: announcementsKeys.all(zoneId) });
    },
  });
};
