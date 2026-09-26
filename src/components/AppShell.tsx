"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ViewTransition } from "react";
import { Briefcase, Calendar, Compass, House, Zap } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { InstallPrompt } from "@/components/InstallPrompt";
import { RegisterSW } from "@/components/RegisterSW";
import { ThemeToggle } from "@/components/ThemeToggle";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/charge", label: "Charge", icon: Zap },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/nomad", label: "Nomad", icon: Compass },
] as const;

const DESKTOP = [
  { href: "/", label: "Home" },
  { href: "/charge", label: "Charge" },
  { href: "/jobs", label: "Jobs" },
  { href: "/learn", label: "Learn" },
  { href: "/events", label: "Events" },
  { href: "/nomad", label: "Nomad" },
] as const;

function active(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
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
      <header className="top-nav glass-bar" style={{ viewTransitionName: "site-header" }}>
        <Link href="/" className="brand">
          <Wordmark />
        </Link>
        <nav aria-label="Sections">
          {DESKTOP.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              transitionTypes={["nav-forward"]}
              aria-current={active(pathname, tab.href) ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
          <Link href="/about" aria-current={pathname.startsWith("/about") ? "page" : undefined}>
            About
          </Link>
        </nav>
        <ThemeToggle />
      </header>
      {charge ? null : (
        <div className="mobile-bar glass-bar">
          <Link href="/" className="brand">
            <Wordmark />
          </Link>
          <div className="mobile-bar-actions">
            <Link href="/learn">Learn</Link>
            <Link href="/about">About</Link>
            <ThemeToggle />
          </div>
        </div>
      )}
      <ViewTransition
        default="none"
        enter={{ "nav-forward": "page-fade", default: "none" }}
        exit={{ "nav-forward": "page-fade", default: "none" }}
      >
        <div id="content" className={charge ? "charge-frame" : "page-frame"}>
          {children}
        </div>
      </ViewTransition>
      <nav className="tab-bar glass-bar" aria-label="Sections">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              transitionTypes={["nav-forward"]}
              aria-current={active(pathname, tab.href) ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={2} aria-hidden />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
      <InstallPrompt />
      <RegisterSW />
    </>
  );
}
