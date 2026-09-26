"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ViewTransition } from "react";
import { BookOpen, Briefcase, Calendar, House, User, Zap } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { InstallBridge } from "@/components/InstallPrompt";
import { AvatarFace } from "@/components/ProfileAvatar";
import { RegisterSW } from "@/components/RegisterSW";
import { ThemeSync } from "@/components/ThemeToggle";
import { profileInitial } from "@/lib/local-profile";
import { useProfile } from "@/lib/profile-store";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/charge", label: "Charge", icon: Zap },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User },
] as const;

const DESKTOP = [
  { href: "/", label: "Home" },
  { href: "/charge", label: "Charge" },
  { href: "/jobs", label: "Jobs" },
  { href: "/events", label: "Events" },
  { href: "/learn", label: "Learn" },
  { href: "/nomad", label: "Nomad" },
  { href: "/profile", label: "Profile" },
] as const;

function active(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/charge") return pathname.startsWith("/charge") || pathname.startsWith("/ev");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

function ProfileTabMark() {
  const profile = useProfile();
  const initial = profileInitial(profile.name);
  if (!initial) return <User size={18} strokeWidth={2} aria-hidden />;
  return <AvatarFace className="tab-avatar" />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const charge = pathname.startsWith("/charge");

  useEffect(() => {
    document.documentElement.classList.remove("is-route-pending");
  }, [pathname]);

  function onNavigate(event: React.MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    const link = (event.target as HTMLElement).closest("a");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    let next: string;
    try {
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      next = url.pathname;
      if (next.startsWith("/nearby")) next = next.slice("/nearby".length) || "/";
      next = normalizePath(next);
    } catch {
      return;
    }
    if (next === normalizePath(pathname)) return;
    // Toggle a class instead of rendering during the click, so the
    // client navigation is not interrupted by a React update.
    document.documentElement.classList.add("is-route-pending");
    window.setTimeout(() => document.documentElement.classList.remove("is-route-pending"), 4000);
  }

  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="top-nav glass-bar" style={{ viewTransitionName: "site-header" }}>
        <Link href="/" className="brand" prefetch>
          <Wordmark />
        </Link>
        <nav aria-label="Sections">
          {DESKTOP.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch
              transitionTypes={["nav-forward"]}
              aria-current={active(pathname, tab.href) ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mobile-bar glass-bar">
        <Link href="/" className="brand" prefetch>
          <Wordmark />
        </Link>
      </div>
      <ViewTransition
        default="none"
        enter={{ "nav-forward": "page-fade", default: "none" }}
        exit={{ "nav-forward": "page-fade", default: "none" }}
      >
        <div id="content" className={charge ? "charge-frame" : "page-frame"} onClickCapture={onNavigate}>
          <div className="route-skeleton" aria-hidden="true">
            <div className="skeleton-block" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
          {children}
        </div>
      </ViewTransition>
      <nav className="tab-bar glass-bar" aria-label="Sections" onClickCapture={onNavigate}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const on = active(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch
              transitionTypes={["nav-forward"]}
              aria-current={on ? "page" : undefined}
            >
              {tab.href === "/profile" ? <ProfileTabMark /> : <Icon size={18} strokeWidth={2} aria-hidden />}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
      <ThemeSync />
      <InstallBridge />
      <RegisterSW />
    </>
  );
}
