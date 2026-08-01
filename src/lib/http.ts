import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/lib/env";
import { csrf } from "./csrf";
import { ApiError, NetworkError } from "./errors";
import { isPublicUnsafePath } from "./public-paths";

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export function notifyUnauthorized() {
  for (const listener of unauthorizedListeners) {
    listener();
  }
}

function pathFromConfig(config: InternalAxiosRequestConfig) {
  const base = config.baseURL ?? env.apiUrl;
  const url = new URL(config.url ?? "", `${base}/`);
  return url.pathname;
}

function retryAfterHeader(headers: Record<string, unknown> | undefined) {
  const value = headers?.["retry-after"];
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : undefined;
}

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const requestId = (error.response?.headers?.["x-request-id"] as string | undefined) ?? undefined;
  const payload = error.response?.data;

  if (typeof payload === "object" && payload) {
    const data = payload as {
      message?: string | string[];
      error?: {
        code?: string;
        message?: string;
        fields?: Record<string, string[]>;
        requestId?: string;
      };
      code?: string;
      fields?: Record<string, string[]>;
    };
    const message = Array.isArray(data.message)
      ? data.message.join(". ")
      : (data.error?.message ?? data.message ?? "Request failed.");
    return new ApiError(
      message,
      status,
      data.error?.code ?? data.code,
      data.error?.fields ?? data.fields,
      data.error?.requestId ?? requestId,
      retryAfterHeader(error.response?.headers as Record<string, unknown> | undefined),
    );
  }

  return new ApiError("Request failed.", status, undefined, undefined, requestId);
}

/**
 * Shared Axios instance used by Orval's `customInstance` mutator.
 * Keeps credentials + CSRF aligned with the hand-written `api` fetch client.
 */
export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

http.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toUpperCase();
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (!unsafe) {
    return config;
  }

  const path = pathFromConfig(config);
  const token = csrf.get();
  if (token) {
    config.headers.set("X-CSRF-Token", token);
  } else if (!isPublicUnsafePath(path)) {
    throw new ApiError(
      "Your session is not ready yet. Refresh the page and try again.",
      0,
      "CSRF_MISSING",
    );
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) {
      throw error;
    }
    if (!axios.isAxiosError(error)) {
      throw error;
    }
    if (!error.response) {
      throw new NetworkError();
    }
    const apiError = toApiError(error);
    if (apiError.status === 401) {
      notifyUnauthorized();
    }
    throw apiError;
  },
);
