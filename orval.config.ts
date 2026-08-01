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

/**
 * Impulse-style Orval: pull the live Nest Swagger document, emit axios clients
 * split by tag, route through `customInstance` (credentials + CSRF).
 *
 * Offline escape hatch: `ORVAL_OPENAPI_URL=../backend/openapi.json pnpm api:generate`
 */
export default defineConfig({
  magodo: {
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
      // Keep the shared schema module available during deployment. Orval's
      // tags-split output regenerates tag clients but does not always emit the
      // schema barrel when the output directory starts empty.
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
