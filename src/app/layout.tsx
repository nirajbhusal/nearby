import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/AppShell";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { flightFetchBoot } from "@/lib/flight-fetch";
import { introBoot } from "@/lib/intro";
import { themeBoot } from "@/lib/tod";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/nearby/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  icons: {
    icon: [
      { url: "/nearby/icon.svg?v=eyes", type: "image/svg+xml" },
      { url: "/nearby/favicon.ico?v=eyes", sizes: "32x32" },
      { url: "/nearby/icons/icon-192.png?v=eyes", sizes: "192x192", type: "image/png" },
      { url: "/nearby/icons/icon-512.png?v=eyes", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/nearby/apple-touch-icon.png?v=eyes", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/nearby/safari-pinned-tab.svg?v=eyes", color: "#0a0a0a" }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: `${SITE_URL}/og.png?v=eyes`, width: 1200, height: 630, alt: SITE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og.png?v=eyes`],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script id="theme-boot" dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <script id="intro-boot" dangerouslySetInnerHTML={{ __html: introBoot }} />
        <link rel="manifest" href="/nearby/manifest-light.webmanifest" media="(prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/nearby/splash/light-1170x2532.png?v=eyes" media="(prefers-color-scheme: light) and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/nearby/splash/dark-1170x2532.png?v=eyes" media="(prefers-color-scheme: dark) and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/nearby/splash/light-1179x2556.png?v=eyes" media="(prefers-color-scheme: light) and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/nearby/splash/dark-1179x2556.png?v=eyes" media="(prefers-color-scheme: dark) and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/nearby/splash/light-1290x2796.png?v=eyes" media="(prefers-color-scheme: light) and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/nearby/splash/dark-1290x2796.png?v=eyes" media="(prefers-color-scheme: dark) and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/nearby/splash/light-1125x2436.png?v=eyes" media="(prefers-color-scheme: light) and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/nearby/splash/dark-1125x2436.png?v=eyes" media="(prefers-color-scheme: dark) and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
      </head>
      <body className="flex min-h-full flex-col bg-[var(--bg)] text-[var(--graphite)]">
        <Script id="flight-fetch" strategy="beforeInteractive">
          {flightFetchBoot}
        </Script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
