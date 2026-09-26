import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dest = join(root, "public", "maplibre");
const dist = join(root, "node_modules", "maplibre-gl", "dist");
mkdirSync(dest, { recursive: true });
for (const name of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, name), join(dest, name));
}
console.log("copied maplibre worker into public/maplibre");
