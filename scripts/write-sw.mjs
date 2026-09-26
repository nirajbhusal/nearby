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

const body = `const CACHE = "nearby-shell-v3";
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

function isFlight(request, url) {
  if (url.pathname.indexOf("/_next/static/") !== -1) return false;
  if (url.searchParams.has("_rsc")) return true;
  if (request.headers.get("RSC") === "1") return true;
  return url.pathname.endsWith(".txt");
}

function flightUrl(url) {
  var next = new URL(url.href);
  if (!next.pathname.endsWith(".txt")) {
    next.pathname = next.pathname.endsWith("/") ? next.pathname + "index.txt" : next.pathname + ".txt";
  }
  return next;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/nearby/")) return;

  if (request.mode === "navigate") {
    const indexPath = url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname;
    event.respondWith((async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1600);
      try {
        const response = await fetch(request, { signal: controller.signal });
        clearTimeout(timer);
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      } catch (error) {
        clearTimeout(timer);
        return (
          (await caches.match(request)) ||
          (await caches.match(indexPath)) ||
          (await caches.match("/nearby/index.html")) ||
          Promise.reject(error)
        );
      }
    })());
    return;
  }

  if (url.pathname.indexOf("/_next/static/") !== -1) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  if (isFlight(request, url)) {
    const target = flightUrl(url);
    event.respondWith(fetch(new Request(target, request)));
    return;
  }
});
`;

writeFileSync(join(outDir, "sw.js"), body);
console.log(`service worker precaches ${urls.size} urls`);
