"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  Briefcase,
  Calendar,
  Compass,
  Ellipsis,
  House,
  PanelLeft,
  User,
  Zap,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { InstallBridge } from "@/components/InstallPrompt";
import { AvatarFace } from "@/components/ProfileAvatar";
import { RegisterSW } from "@/components/RegisterSW";
import { toHref } from "@/components/SiteLink";
import { ThemeChoiceControl, ThemeSync } from "@/components/ThemeToggle";
import { profileInitial } from "@/lib/local-profile";
import { useProfile } from "@/lib/profile-store";

const NAV = [
  { href: "/", label: "Home", icon: House },
  { href: "/charge", label: "Charge", icon: Zap },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/nomad", label: "Nomad", icon: Compass },
] as const;

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/charge", label: "Charge", icon: Zap },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/events", label: "Events", icon: Calendar },
] as const;

function active(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/charge") return pathname.startsWith("/charge") || pathname.startsWith("/ev");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/charge") || pathname.startsWith("/ev")) return "Charge";
  if (pathname.startsWith("/jobs")) return "Jobs";
  if (pathname.startsWith("/events")) return "Events";
  if (pathname.startsWith("/learn")) return "Learn";
  if (pathname.startsWith("/nomad/pokhara")) return "Pokhara";
  if (pathname.startsWith("/nomad")) return "Nomad";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/about")) return "About";
  return "Nearby";
}

function moreActive(pathname: string): boolean {
  return ["/learn", "/nomad", "/profile", "/about"].some((href) => active(pathname, href));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const charge = pathname.startsWith("/charge");
  const profile = useProfile();
  const initial = profileInitial(profile.name);
  const [collapsed, setCollapsed] = useState(false);
  const [more, setMore] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "auto";
    const sync = () => setOffline(typeof navigator !== "undefined" && navigator.onLine === false);
    sync();
    window.addEventListener("offline", sync);
    window.addEventListener("online", sync);
    return () => {
      window.removeEventListener("offline", sync);
      window.removeEventListener("online", sync);
    };
  }, []);

  useEffect(() => {
    setMore(false);
  }, [pathname]);

  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <div className={collapsed ? "app-shell is-collapsed" : "app-shell"}>
        <aside className="side-nav" aria-label="Sections">
          <div className="side-brand">
            <a className="brand-lockup" href={toHref("/")}>
              <Wordmark />
            </a>
            <button
              type="button"
              className="icon-btn side-collapse"
              aria-pressed={collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((value) => !value)}
            >
              <PanelLeft size={20} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          <nav className="side-links">
            {NAV.map((item) => {
              const Icon = item.icon;
              const on = active(pathname, item.href);
              return (
                <a key={item.href} href={toHref(item.href)} aria-current={on ? "page" : undefined}>
                  <Icon size={20} strokeWidth={1.5} aria-hidden />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
          <div className="side-foot">
            <a href={toHref("/profile#saved")} aria-current={pathname.startsWith("/profile") ? undefined : undefined}>
              <Bookmark size={20} strokeWidth={1.5} aria-hidden />
              <span>Saved</span>
            </a>
            <a href={toHref("/profile")} aria-current={active(pathname, "/profile") ? "page" : undefined}>
              {initial ? <AvatarFace className="tab-avatar" /> : <User size={20} strokeWidth={1.5} aria-hidden />}
              <span>Profile</span>
            </a>
            <ThemeChoiceControl compact />
          </div>
        </aside>
        <div className="shell-main">
          <header className="mobile-top">
            <a className="brand-lockup" href={toHref("/")}>
              <Wordmark />
            </a>
            <p className="mobile-title">{pageTitle(pathname)}</p>
            <a className="icon-btn" href={toHref("/profile")} aria-label="Profile">
              {initial ? <AvatarFace className="tab-avatar" /> : <User size={20} strokeWidth={1.5} aria-hidden />}
            </a>
          </header>
          {offline ? (
            <p className="offline-note" role="status">
              You’re offline. Pages you’ve opened recently still load.
            </p>
          ) : null}
          <div id="content" className={charge ? "charge-frame" : "page-frame"}>
            {children}
          </div>
        </div>
      </div>
      <nav className="tab-bar" aria-label="Sections">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const on = active(pathname, tab.href);
          return (
            <a key={tab.href} href={toHref(tab.href)} aria-current={on ? "page" : undefined}>
              <Icon size={24} strokeWidth={1.5} aria-hidden />
              <span>{tab.label}</span>
            </a>
          );
        })}
        <button type="button" aria-expanded={more} aria-current={moreActive(pathname) ? "page" : undefined} onClick={() => setMore((open) => !open)}>
          <Ellipsis size={24} strokeWidth={1.5} aria-hidden />
          <span>More</span>
        </button>
      </nav>
      {more ? (
        <div className="more-layer">
          <button type="button" className="more-scrim" aria-label="Close menu" onClick={() => setMore(false)} />
          <div className="more-panel" role="dialog" aria-label="More">
            <a href={toHref("/learn")}>
              <BookOpen size={20} strokeWidth={1.5} aria-hidden />
              Learn
            </a>
            <a href={toHref("/nomad")}>
              <Compass size={20} strokeWidth={1.5} aria-hidden />
              Nomad
            </a>
            <a href={toHref("/profile#saved")}>
              <Bookmark size={20} strokeWidth={1.5} aria-hidden />
              Saved
            </a>
            <a href={toHref("/profile")}>
              <User size={20} strokeWidth={1.5} aria-hidden />
              Settings
            </a>
          </div>
        </div>
      ) : null}
      <ThemeSync />
      <InstallBridge />
      <RegisterSW />
    </>
  );
}
