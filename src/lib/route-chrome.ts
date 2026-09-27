import { BASE_PATH } from "@/lib/base-path";

/** Pathname without the GitHub Pages base, query, or trailing slash. */
export function normalizeRoute(pathname: string): string {
  let path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length) || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (!path.startsWith("/")) path = `/${path}`;
  return path || "/";
}

/** `/events` must not match the charger prefix `/ev`. */
export function isChargeRoute(pathname: string): boolean {
  const path = normalizeRoute(pathname);
  return path === "/charge" || path.startsWith("/charge/") || path.startsWith("/ev/");
}

export function pageTitle(pathname: string): string {
  const path = normalizeRoute(pathname);
  if (isChargeRoute(path)) return "Charge";
  if (path.startsWith("/jobs")) return "Jobs";
  if (path.startsWith("/events")) return "Events";
  if (path.startsWith("/learn")) return "Learn";
  if (path.startsWith("/nomad/pokhara")) return "Pokhara";
  if (path.startsWith("/nomad")) return "Nomad";
  if (path.startsWith("/profile")) return "Profile";
  if (path.startsWith("/about")) return "About";
  return "Nearby";
}

export function tabActive(pathname: string, href: string): boolean {
  const path = normalizeRoute(pathname);
  if (href === "/") return path === "/";
  if (href === "/charge") return isChargeRoute(path);
  return path === href || path.startsWith(`${href}/`);
}

export function moreActive(pathname: string): boolean {
  return ["/learn", "/nomad", "/profile", "/about"].some((href) => tabActive(pathname, href));
}
