"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SketchPin } from "@/components/illustrations/SketchPin";

const TABS = [
  { href: "/charge", label: "Charge", icon: "charge" },
  { href: "/jobs", label: "Jobs", icon: "jobs" },
  { href: "/learn", label: "Learn", icon: "learn" },
  { href: "/events", label: "Events", icon: "events" },
  { href: "/nomad", label: "Nomad", icon: "nomad" },
] as const;

function active(pathname: string, href: string): boolean {
  if (href === "/charge") return pathname.startsWith("/charge") || pathname.startsWith("/ev");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const charge = pathname.startsWith("/charge");

  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="top-nav">
        <Link href="/" className="brand">
          <SketchPin className="h-4 w-4 text-[var(--accent)]" />
          Nearby
        </Link>
        <nav aria-label="Sections">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active(pathname, tab.href) ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <Link href="/about" className="top-about">
          About
        </Link>
      </header>
      {charge ? null : (
        <div className="mobile-bar">
          <Link href="/" className="brand">
            <SketchPin className="h-4 w-4 text-[var(--accent)]" />
            Nearby
          </Link>
          <Link href="/about">About</Link>
        </div>
      )}
      <div id="content" className={charge ? "charge-frame" : "page-frame"}>
        {children}
      </div>
      <nav className="tab-bar" aria-label="Sections">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active(pathname, tab.href) ? "page" : undefined}
          >
            <TabIcon name={tab.icon} />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

function TabIcon({ name }: { name: (typeof TABS)[number]["icon"] }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true as const,
  };
  if (name === "charge") {
    return (
      <svg {...common}>
        <path d="M13 3 6.5 13.5h5L10 21l7.5-11.5h-5L13 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "jobs") {
    return (
      <svg {...common}>
        <rect x="4" y="8" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === "learn") {
    return (
      <svg {...common}>
        <path d="M4 8.5 12 5l8 3.5L12 12 4 8.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7.5 10.2V15c1.6 1.2 3 1.8 4.5 1.8s2.9-.6 4.5-1.8v-4.8" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === "events") {
    return (
      <svg {...common}>
        <rect x="4" y="5.5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 4v3M16 4v3M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 18.5c.8-2.6 2.8-4 5.5-4s4.7 1.4 5.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
