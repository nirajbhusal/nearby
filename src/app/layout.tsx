import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/AppShell";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const themeBoot = `(function(){try{var choice=localStorage.getItem("nearby-theme-choice");var legacy=localStorage.getItem("nearby-theme");if(choice!=="light"&&choice!=="dark"&&choice!=="system"){choice=(legacy==="light"||legacy==="dark")?legacy:"system"}var resolved=choice==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):choice;document.documentElement.dataset.theme=resolved;document.documentElement.dataset.themeChoice=choice}catch(e){document.documentElement.dataset.theme="dark"}})();`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — EV charging in Nepal`,
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
      { url: "/nearby/icon.svg", type: "image/svg+xml" },
      { url: "/nearby/favicon.ico", sizes: "32x32" },
      { url: "/nearby/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/nearby/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/nearby/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/nearby/safari-pinned-tab.svg", color: "#00F5A0" }],
  },
  openGraph: {
    title: `${SITE_NAME} — EV charging in Nepal`,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Nearby" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — EV charging in Nepal`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og.png`],
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
      <body className="flex min-h-full flex-col bg-[var(--bg)] text-[var(--graphite)]">
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
