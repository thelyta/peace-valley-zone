export type ApiFieldErrors = Record<string, string[] | undefined>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fields?: ApiFieldErrors,
    public readonly requestId?: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message = "Unable to reach the service. Check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(message = "The request took too long. Please try again.") {
    super(message);
    this.name = "TimeoutError";
  }
}
