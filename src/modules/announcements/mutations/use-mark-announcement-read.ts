import { useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsControllerRead } from "@/api/generated/announcements/announcements";
import { announcementsKeys } from "@/modules/announcements/query-keys";
import { handleApiError } from "@/utils/error";

export const useMarkAnnouncementRead = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (id: string) => announcementsControllerRead(zoneId, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: announcementsKeys.all(zoneId) });
    },
  });
};
