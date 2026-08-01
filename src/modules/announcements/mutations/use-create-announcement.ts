import { useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsControllerCreate } from "@/api/generated/announcements/announcements";
import type { CreateAnnouncementDto } from "@/api/generated/magodoEstateAPI.schemas";
import { announcementsKeys } from "@/modules/announcements/query-keys";
import { handleApiError } from "@/utils/error";

export const useCreateAnnouncement = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (body: CreateAnnouncementDto) => announcementsControllerCreate(zoneId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: announcementsKeys.all(zoneId) });
    },
  });
};
