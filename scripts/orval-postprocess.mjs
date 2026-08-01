import fs from "node:fs";
import path from "node:path";

const ROOT = "src/api/generated";
const HEADER = "// @ts-nocheck\n";

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith(".ts")) {
      const content = fs.readFileSync(full, "utf8");
      if (!content.startsWith("// @ts-nocheck")) {
        fs.writeFileSync(full, HEADER + content);
      }
    }
  }
};

if (fs.existsSync(ROOT)) walk(ROOT);
