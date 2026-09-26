import type { ComponentProps } from "react";
import { BASE_PATH } from "@/lib/base-path";

type Props = Omit<ComponentProps<"a">, "href"> & {
  href: string;
  /** Ignored. Main navigation is a normal document load. */
  prefetch?: boolean;
  transitionTypes?: string[];
};

/** Same-origin path with `basePath` and a trailing slash, so GitHub Pages serves the prerendered file. */
export function toHref(href: string): string {
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("http://") ||
    href.startsWith("https://")
  ) {
    return href;
  }
  const hashAt = href.indexOf("#");
  const hash = hashAt >= 0 ? href.slice(hashAt) : "";
  const beforeHash = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const queryAt = beforeHash.indexOf("?");
  const path = queryAt >= 0 ? beforeHash.slice(0, queryAt) : beforeHash;
  const query = queryAt >= 0 ? beforeHash.slice(queryAt) : "";
  let normalized = path.startsWith("/") ? path : `/${path}`;
  if (!normalized.startsWith(BASE_PATH)) normalized = `${BASE_PATH}${normalized === "/" ? "/" : normalized}`;
  if (normalized.length > BASE_PATH.length + 1 && normalized.endsWith("/")) {
    /* already */
  } else if (!normalized.endsWith("/")) {
    normalized = `${normalized}/`;
  }
  return `${normalized}${query}${hash}`;
}

/** Plain anchor. Next's client router is not used, so a tap cannot sit in a pending transition. */
export function SiteLink({ href, prefetch: _prefetch, transitionTypes: _types, ...rest }: Props) {
  return <a href={toHref(href)} {...rest} />;
}
