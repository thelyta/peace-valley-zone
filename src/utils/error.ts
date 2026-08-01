import { ApiError } from "@/lib/errors";
import { toast } from "@/ui/feedback";
import { userMessageForError } from "./error-messages";

/**
 * Shared mutation `onError` handler (Nexus/Lekker `handleAxiosError` pattern).
 * Maps API codes to user copy and surfaces a toast. 401 is left to `onUnauthorized`.
 */
export function handleApiError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return;
  }
  toast(userMessageForError(error, "Something went wrong. Please try again."));
}
