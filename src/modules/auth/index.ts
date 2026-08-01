export type {
  TAuthenticatedLoginResponse,
  TDeviceSession,
  TDeviceVerificationRequiredResponse,
  TLoginResponse,
} from "@/types/auth";
export {
  ChangePasswordForm,
  DeviceVerificationForm,
  ForgotPasswordForm,
  LoginForm,
  PasswordForm,
} from "./components";
export { SessionsList } from "./components/sessions-panel";
export { useActivateAccount } from "./mutations/use-activate-account";
export { useChangePassword } from "./mutations/use-change-password";
export { useForgotPassword } from "./mutations/use-forgot-password";
export { useLogin } from "./mutations/use-login";
export { useLogout } from "./mutations/use-logout";
export { useResendDeviceChallenge } from "./mutations/use-resend-device-challenge";
export { useResetPassword } from "./mutations/use-reset-password";
export { useRevokeOtherSessions } from "./mutations/use-revoke-other-sessions";
export { useRevokeSession } from "./mutations/use-revoke-session";
export { useVerifyDevice } from "./mutations/use-verify-device";
export { sessionQueryOptions, useFetchSession } from "./queries/use-fetch-session";
export { sessionsQueryOptions, useFetchSessions } from "./queries/use-fetch-sessions";
export { authKeys } from "./query-keys";
export { completeAuthenticatedSession } from "./utils/complete-authenticated-session";
export { adminNavItems, primaryNavItems, residentNavItems } from "./utils/navigation";
export {
  canAccessAdminArea,
  canAccessResidentArea,
  canAccessSecurityArea,
  getDefaultRouteForZone,
  getZoneRole,
  hasAnyPermission,
  hasHouseholdCapability,
  hasPermission,
  Permission,
} from "./utils/permission";
export { routeAllowed, safeReturnTo } from "./utils/route-access";
