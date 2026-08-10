import { defineConfig } from "orval";

declare const process: {
  env: Record<string, string | undefined>;
  loadEnvFile?: (path: string) => void;
};

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile?.(file);
  } catch {
    // file missing — ignore
  }
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!backendUrl && !process.env.ORVAL_OPENAPI_URL) {
  throw new Error(
    "Set NEXT_PUBLIC_API_URL (for live /docs-json) or ORVAL_OPENAPI_URL (offline OpenAPI URL/path).",
  );
}

export default defineConfig({
  estately: {
    hooks: {
      afterAllFilesWrite: "node scripts/orval-postprocess.mjs",
    },
    input: {
      target: process.env.ORVAL_OPENAPI_URL ?? `${backendUrl}/docs-json`,
    },
    output: {
      client: "axios-functions",
      mode: "tags-split",
      target: "./src/api/generated",
      clean: false,
      override: {
        mutator: {
          name: "customInstance",
          path: "./src/lib/mutator.ts",
        },
      },
    },
  },
});
