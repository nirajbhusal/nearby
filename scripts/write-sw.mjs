import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = fileURLToPath(new URL("../out/", import.meta.url));

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

const shell = [
  "index.html",
  "charge/index.html",
  "jobs/index.html",
  "learn/index.html",
  "events/index.html",
  "nomad/index.html",
  "nomad/kathmandu/index.html",
  "nomad/pokhara/index.html",
  "about/index.html",
  "manifest.webmanifest",
  "icon.svg",
  "favicon.ico",
  "og.png",
  "apple-touch-icon.png",
];

const urls = new Set(shell.map((file) => `/nearby/${file}`));
for (const file of walk(join(outDir, "_next/static"))) {
  const rel = file.slice(outDir.length).replaceAll("\\", "/");
  urls.add(`/nearby/${rel}`);
}

const body = `const CACHE = "nearby-shell-v1";
const PRECACHE = ${JSON.stringify([...urls], null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/nearby/")) return;

  if (request.mode === "navigate") {
    const indexPath = url.pathname.endsWith("/") ? \`\${url.pathname}index.html\` : url.pathname;
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () =>
          (await caches.match(request)) ||
          (await caches.match(indexPath)) ||
          (await caches.match("/nearby/index.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networked = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
`;

writeFileSync(join(outDir, "sw.js"), body);
console.log(`service worker precaches ${urls.size} urls`);
