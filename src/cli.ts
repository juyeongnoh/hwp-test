import { readFileSync } from "node:fs";
import * as CFB from "cfb";

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run dev -- <path-to-hwp>");
    process.exit(1);
  }

  const buf = readFileSync(filePath);
  const container = CFB.parse(buf, { raw: true });

  console.log(`Storage entries: ${container.FullPaths.length}\n`);

  container.FileIndex.forEach((entry, i) => {
    const path = container.FullPaths[i];
    const type = entry.type === 2 ? "STREAM" : "STORAGE";
    const size = entry.size ?? 0;
    console.log(`[${type}] ${path}${size ? ` (${size} bytes)` : ""}`);
  });
}

main();
