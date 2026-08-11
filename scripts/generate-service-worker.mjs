import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(projectRoot, "public", "sw.template.js");
const outputPath = path.join(projectRoot, "public", "sw.js");

function gitBuildId() {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "development";
  }
}

const rawBuildId =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.VERCEL_URL ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  gitBuildId();
const buildId = rawBuildId.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 64) || "development";
const template = await readFile(templatePath, "utf8");

if (!template.includes("__BUILD_ID__")) {
  throw new Error("Service-worker template is missing the build ID placeholder.");
}

await writeFile(outputPath, template.replaceAll("__BUILD_ID__", buildId));
console.log(`Generated service worker for build ${buildId}.`);
