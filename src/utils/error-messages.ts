import { ApiError, NetworkError } from "@/lib/errors";

export function userMessageForError(error: unknown, fallback: string) {
  if (error instanceof NetworkError) {
    return error.message;
  }
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  switch (error.code) {
    case "CSRF_MISSING":
    case "CSRF_INVALID":
      return "Your session needs a refresh. Reload the page and try again.";
    case "RATE_LIMITED":
      return error.retryAfter
        ? `Sign-in is temporarily restricted. Try again in ${error.retryAfter} seconds.`
        : "Sign-in is temporarily restricted. Please wait and try again.";
    case "OTP_INVALID":
      return (
        error.message || "The code you entered is incorrect. Check your latest email and try again."
      );
    case "OTP_EXPIRED":
      return "That code has expired. Request a new one.";
    case "OTP_ATTEMPTS_EXHAUSTED":
      return "This code has been locked after too many incorrect attempts. Request a new code to continue.";
    case "ACCOUNT_INACTIVE":
      return "This account is inactive. Contact estate management.";
    case "ACCOUNT_NOT_ACTIVATED":
      return "Your account has not been activated. Use the invitation email to set your password, then sign in.";
    case "GATE_SELECTION_REQUIRED":
      return "Choose which gate your visitor should use.";
    case "PARTY_SIZE_INVALID":
      return "That party size is outside the allowed range.";
    case "VISITOR_CREATE_FORBIDDEN":
    case "MEMBER_CANNOT_INVITE":
      return "You cannot create visitor passes for this home.";
    case "HOUSEHOLD_DUES_NOT_ELIGIBLE":
    case "HOUSEHOLD_OVERRIDE_BLOCK":
    case "DUES_OVERRIDE_BLOCK":
      return "Visitor invitations are blocked for this home right now. Contact estate management.";
    case "PASS_WRONG_GATE":
      return "This pass is not valid at this gate.";
    case "PASS_ALREADY_USED":
      return "This pass has already been used.";
    case "PASS_CANCELLED":
      return "This pass was cancelled.";
    case "PASS_EXPIRED":
      return "This pass has expired.";
    case "PASS_CODE_UNAVAILABLE":
      return "This pass code is no longer available. Cancel it and create a new one to share again.";
    case "PASS_REVEAL_FORBIDDEN":
      return "You cannot view this visitor pass code.";
    case "GATE_ASSIGNMENT_REQUIRED":
      return "You are not assigned to this gate.";
    case "IDEMPOTENCY_KEY_REQUIRED":
      return "Something went wrong creating this pass. Try again.";
    default:
      return error.message || fallback;
  }
}

export function eligibilityExplanation(reason: string | undefined) {
  switch (reason) {
    case "DUES_ELIGIBLE":
    case "POLICY_ALLOW_ALWAYS":
    case "HOUSEHOLD_OVERRIDE_ALLOW":
    case "DUES_OVERRIDE_ALLOW":
      return "This home can invite visitors.";
    case "HOUSEHOLD_DUES_NOT_ELIGIBLE":
      return "Visitor invitations are paused until current dues are settled.";
    case "HOUSEHOLD_OVERRIDE_BLOCK":
    case "DUES_OVERRIDE_BLOCK":
      return "Estate management has paused visitor invitations for this home.";
    case "MEMBER_CANNOT_INVITE":
      return "Your account cannot invite visitors for this home.";
    case "HOUSEHOLD_NOT_FOUND":
      return "This home could not be found.";
    default:
      return "Visitor invitations are unavailable for this home.";
  }
}
