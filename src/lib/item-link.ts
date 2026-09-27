import { BASE_PATH } from "@/lib/base-path";
import { showToast } from "@/lib/toast";

export function appPath(path: string): string {
  const hashAt = path.indexOf("#");
  const hash = hashAt >= 0 ? path.slice(hashAt) : "";
  const before = hashAt >= 0 ? path.slice(0, hashAt) : path;
  const queryAt = before.indexOf("?");
  const pathname = queryAt >= 0 ? before.slice(0, queryAt) : before;
  const query = queryAt >= 0 ? before.slice(queryAt) : "";
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withBase = normalized.startsWith(BASE_PATH) ? normalized : `${BASE_PATH}${normalized}`;
  return `${withBase}${query}${hash}`;
}

export function absoluteItemUrl(path: string): string {
  if (typeof window === "undefined") return appPath(path);
  return new URL(appPath(path), window.location.origin).toString();
}

export function hapticTick() {
  try {
    navigator.vibrate?.(10);
  } catch {
    /* unsupported */
  }
}

export async function shareOrCopy(payload: { title: string; text?: string; url: string }) {
  const url = absoluteItemUrl(payload.url);
  const data = { title: payload.title, text: payload.text || payload.title, url };
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  } catch {
    showToast("Copy this link from the address bar");
  }
}

export function chargeHref(id: string): string {
  return `/charge/?id=${encodeURIComponent(id)}`;
}

export function jobHref(id: string): string {
  return `/jobs/?id=${encodeURIComponent(id)}`;
}

export function eventHref(id: string): string {
  return `/events/?id=${encodeURIComponent(id)}`;
}

export function learnHref(id: string): string {
  return `/learn/?id=${encodeURIComponent(id)}`;
}

export function stayHref(city: string, id: string): string {
  return `/nomad/?city=${encodeURIComponent(city)}&stay=${encodeURIComponent(id)}`;
}

export function workHref(city: string, id: string): string {
  return `/nomad/?city=${encodeURIComponent(city)}&work=${encodeURIComponent(id)}`;
}
