import { env } from "@/lib/env";
import { csrf } from "./csrf";
import { ApiError, NetworkError } from "./errors";
import { notifyUnauthorized, onUnauthorized } from "./http";
import { isPublicUnsafePath } from "./public-paths";

export { onUnauthorized };

type QueryValue = string | number | boolean | null | undefined;
type ApiOptions = Omit<RequestInit, "body" | "method" | "headers"> & {
  query?: Record<string, QueryValue>;
  body?: unknown;
  idempotencyKey?: string;
  accept?: string;
  raw?: boolean;
  onUnauthorized?: () => void;
};

function urlFor(path: string, query?: ApiOptions["query"]) {
  const url = new URL(path, `${env.apiUrl}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function retryAfter(response: Response) {
  const value = response.headers.get("Retry-After");
  return value && /^\d+$/.test(value) ? Number(value) : undefined;
}

async function parseError(response: Response) {
  const requestId = response.headers.get("x-request-id") ?? undefined;
  try {
    const payload: unknown = await response.json();
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
        response.status,
        data.error?.code ?? data.code,
        data.error?.fields ?? data.fields,
        data.error?.requestId ?? requestId,
        retryAfter(response),
      );
    }
  } catch {
    // Non-JSON error bodies fall through to the generic message.
  }
  return new ApiError(
    "Request failed.",
    response.status,
    undefined,
    undefined,
    requestId,
    retryAfter(response),
  );
}

async function request<T>(method: string, path: string, options: ApiOptions = {}): Promise<T> {
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = new Headers({ Accept: options.accept ?? "application/json" });
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (unsafe) {
    const token = csrf.get();
    if (token) {
      headers.set("X-CSRF-Token", token);
    } else if (!isPublicUnsafePath(path)) {
      throw new ApiError(
        "Your session is not ready yet. Refresh the page and try again.",
        0,
        "CSRF_MISSING",
      );
    }
  }

  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  let response: Response;
  try {
    response = await fetch(urlFor(path, options.query), {
      ...options,
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new NetworkError();
    }
    throw error;
  }

  if (!response.ok) {
    const error = await parseError(response);
    if (error.status === 401) {
      options.onUnauthorized?.();
      notifyUnauthorized();
    }
    throw error;
  }

  if (options.raw) {
    return response as T;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: ApiOptions) => request<T>("DELETE", path, options),
  download: (path: string, options?: ApiOptions) =>
    request<Response>("GET", path, {
      ...options,
      accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      raw: true,
    }),
};
