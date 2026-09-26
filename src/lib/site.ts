import type { Metadata } from "next";

export const SITE_URL = "https://nirajbhusal.github.io/nearby";
export const SITE_NAME = "Nearby";
export const SITE_TAGLINE = "Nearby: Nepal, within reach";
export const SITE_DESCRIPTION = "Nearby: Nepal, within reach";

const OG_IMAGE = `${SITE_URL}/og.png`;

export function pageMeta(title: string, description: string, path = "/"): Metadata {
  const url = `${SITE_URL}${path.endsWith("/") ? path : `${path}/`}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Nearby: Nepal, within reach" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
