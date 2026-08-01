import type { AxiosRequestConfig } from "axios";
import { http } from "./http";

/**
 * Orval mutator (axios-functions). Preserves Magodo CSRF + cookie credentials
 * via the shared `http` instance. Returns the JSON body as-is (no envelope unwrap).
 */
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return http.request<T>(config).then((response) => response.data);
};
