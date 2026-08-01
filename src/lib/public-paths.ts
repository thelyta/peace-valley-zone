/** Paths that may omit CSRF on unsafe methods (login / recovery / activate). */
export function isPublicUnsafePath(path: string) {
  if (
    path === "/v1/auth/login" ||
    path === "/v1/auth/password/forgot" ||
    path === "/v1/auth/password/reset" ||
    path === "/v1/auth/account/activate"
  ) {
    return true;
  }
  return /^\/v1\/auth\/device-challenges\/[^/]+\/(verify|resend)$/.test(path);
}
