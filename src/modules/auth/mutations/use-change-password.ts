import { useMutation } from "@tanstack/react-query";
import { authControllerChangePassword } from "@/api/generated/auth/auth";
import type { ChangePasswordDto } from "@/api/generated/magodoEstateAPI.schemas";
import { handleApiError } from "@/utils/error";

export const useChangePassword = () =>
  useMutation({
    mutationFn: (body: ChangePasswordDto) => authControllerChangePassword(body),
    onError: handleApiError,
  });
