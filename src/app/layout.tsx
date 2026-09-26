import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nearby — EV charging, jobs, and events in Nepal",
  description:
    "A Nepal-first finder for EV charging, tech jobs, places to learn AI, and tech events. Curated from public directories and official pages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="grain flex min-h-full flex-col bg-[var(--paper)] text-[var(--graphite)]">
        <Nav />
        <div className="relative z-0 flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
