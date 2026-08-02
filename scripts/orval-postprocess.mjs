import fs from "node:fs";
import path from "node:path";

const ROOT = "src/api/generated";
const HEADER = "// @ts-nocheck\n";

const normalizeSchemaModule = () => {
  const schemaFiles = fs
    .readdirSync(ROOT)
    .filter((name) => /^.+API\.schemas\.ts$/.test(name))
    .map((name) => ({
      name,
      mtime: fs.statSync(path.join(ROOT, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  const source = schemaFiles[0];
  if (!source) return;
  for (const alias of ["estatelyAPI.schemas.ts", "magodoEstateAPI.schemas.ts"]) {
    if (alias !== source.name) {
      fs.copyFileSync(path.join(ROOT, source.name), path.join(ROOT, alias));
    }
  }
};

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith(".ts")) {
      const content = fs.readFileSync(full, "utf8");
      if (!content.startsWith("// @ts-nocheck")) {
        fs.writeFileSync(full, HEADER + content);
      } else {
        fs.writeFileSync(full, content);
      }
    }
  }
};

if (fs.existsSync(ROOT)) {
  normalizeSchemaModule();
  walk(ROOT);
}
