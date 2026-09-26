import type { Metadata } from "next";

export const SITE_URL = "https://nirajbhusal.github.io/nearby";
export const SITE_NAME = "Nearby";
export const SITE_TAGLINE = "All within reach.";
export const SITE_TITLE = "Nearby · All within reach";
/** Search and share text. The visible tagline does not repeat the country. */
export const SITE_DESCRIPTION =
  "Nearby is a Nepal guide to EV chargers, tech jobs, events, and places to learn AI.";

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
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_TITLE }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
