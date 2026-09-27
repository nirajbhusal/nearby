"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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
import { BrandEyes, Wordmark } from "@/components/brand/Logo";
import { InstallBridge } from "@/components/InstallPrompt";
import { AvatarFace } from "@/components/ProfileAvatar";
import { RegisterSW } from "@/components/RegisterSW";
import { toHref } from "@/components/SiteLink";
import { IntroSplash } from "@/components/motion/IntroSplash";
import { ToastHost } from "@/components/motion/ToastHost";
import { ThemeChoiceControl, ThemeMenuButton, ThemeSync } from "@/components/ThemeToggle";
import { profileInitial } from "@/lib/local-profile";
import { useProfile } from "@/lib/profile-store";
import { isChargeRoute, moreActive, normalizeRoute, pageTitle, tabActive } from "@/lib/route-chrome";

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

function subscribeLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener("pageshow", onStoreChange);
  window.addEventListener("hashchange", onStoreChange);
  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener("pageshow", onStoreChange);
    window.removeEventListener("hashchange", onStoreChange);
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const routerPath = usePathname() || "/";
  const path = useSyncExternalStore(
    subscribeLocation,
    () => normalizeRoute(window.location.pathname),
    () => normalizeRoute(routerPath),
  );
  const charge = isChargeRoute(path);
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
  }, [path]);

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
              const on = tabActive(path, item.href);
              return (
                <a key={item.href} href={toHref(item.href)} aria-current={on ? "page" : undefined}>
                  <Icon size={20} strokeWidth={1.5} aria-hidden />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
          <div className="side-foot">
            <a href={toHref("/profile#saved")}>
              <Bookmark size={20} strokeWidth={1.5} aria-hidden />
              <span>Saved</span>
            </a>
            <a href={toHref("/profile")} aria-current={tabActive(path, "/profile") ? "page" : undefined}>
              {initial ? <AvatarFace className="tab-avatar" /> : <User size={20} strokeWidth={1.5} aria-hidden />}
              <span>Profile</span>
            </a>
            <ThemeChoiceControl compact />
          </div>
        </aside>
        <div className="shell-main">
          <div className="desk-theme">
            <ThemeMenuButton />
          </div>
          <header className={path === "/" ? "mobile-top is-home" : "mobile-top"} data-route={path}>
            <a className="brand-lockup" href={toHref("/")} aria-label={path === "/" ? undefined : "Nearby"}>
              {path === "/" ? <Wordmark mark={false} /> : <BrandEyes />}
            </a>
            {path === "/" ? <span className="mobile-title" /> : <p className="mobile-title">{pageTitle(path)}</p>}
            <div className="mobile-actions">
              <ThemeMenuButton />
              <a className="icon-btn" href={toHref("/profile")} aria-label="Profile">
                {initial ? <AvatarFace className="tab-avatar" /> : <User size={20} strokeWidth={1.5} aria-hidden />}
              </a>
            </div>
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
          const on = tabActive(path, tab.href);
          return (
            <a key={tab.href} href={toHref(tab.href)} aria-current={on ? "page" : undefined}>
              <Icon size={24} strokeWidth={1.5} aria-hidden />
              <span>{tab.label}</span>
            </a>
          );
        })}
        <button type="button" aria-expanded={more} aria-current={moreActive(path) ? "page" : undefined} onClick={() => setMore((open) => !open)}>
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
      <IntroSplash />
      <ToastHost />
      <ThemeSync />
      <InstallBridge />
      <RegisterSW />
    </>
  );
}
