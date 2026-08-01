const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const appEnv = process.env.NEXT_PUBLIC_APP_ENV;

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL must be configured.");
}

if (!appEnv) {
  throw new Error("NEXT_PUBLIC_APP_ENV must be configured.");
}

export const env = {
  apiUrl,
  appEnv,
} as const;
