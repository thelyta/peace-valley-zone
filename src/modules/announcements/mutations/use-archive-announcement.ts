import { useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsControllerArchive } from "@/api/generated/announcements/announcements";
import { announcementsKeys } from "@/modules/announcements/query-keys";
import { handleApiError } from "@/utils/error";

export const useArchiveAnnouncement = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (id: string) => announcementsControllerArchive(zoneId, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: announcementsKeys.all(zoneId) });
    },
  });
};
