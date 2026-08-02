import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateZoneSettingsDto } from "@/api/generated/estatelyAPI.schemas";
import { zonesControllerSettings } from "@/api/generated/zones/zones";
import { zonesKeys } from "@/modules/zones/query-keys";
import { handleApiError } from "@/utils/error";

export const useUpdateZoneSettings = (zoneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    onError: handleApiError,
    mutationFn: (body: UpdateZoneSettingsDto) => zonesControllerSettings(zoneId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: zonesKeys.detail.all(zoneId) });
    },
  });
};
