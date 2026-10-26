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
  Utensils,
  Zap,
} from "lucide-react";
import { BrandEyes } from "@/components/brand/Logo";
import { OnNow } from "@/components/OnNow";
import { AskDock } from "@/components/home/AskNearby";
import { InstallBridge } from "@/components/InstallPrompt";
import { AvatarFace } from "@/components/ProfileAvatar";
import { RegisterSW } from "@/components/RegisterSW";
import { toHref } from "@/components/SiteLink";
import { IntroSplash } from "@/components/motion/IntroSplash";
import { ToastHost } from "@/components/motion/ToastHost";
import { SettingsMenu, ThemeSync, ThemeToggle } from "@/components/ThemeToggle";
import { profileInitial } from "@/lib/local-profile";
import { useProfile } from "@/lib/profile-store";
import { isChargeRoute, isFoodRoute, moreActive, normalizeRoute, pageTitle, tabActive } from "@/lib/route-chrome";
import { sidebarRailNow, subscribeSidebar, writeSidebarRail } from "@/lib/sidebar";

const NAV = [
  { href: "/", label: "Home", icon: House },
  { href: "/charge", label: "Charging stations", icon: Zap },
  { href: "/food", label: "Cafés & food", icon: Utensils },
  { href: "/jobs", label: "Tech jobs", icon: Briefcase },
  { href: "/events", label: "Tech events", icon: Calendar },
  { href: "/learn", label: "Learn AI", icon: BookOpen },
  { href: "/nomad", label: "Digital nomads", icon: Compass },
] as const;

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/charge", label: "Charging", icon: Zap },
  { href: "/food", label: "Food", icon: Utensils },
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
  const charge = isChargeRoute(path) || isFoodRoute(path);
  const profile = useProfile();
  const initial = profileInitial(profile.name);
  const sidebarRail = useSyncExternalStore(subscribeSidebar, sidebarRailNow, () => false);
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
      <div className="app-shell">
        <aside id="site-sidebar" className="side-nav" aria-label="Sections">
          <div className="side-brand">
            <a className="brand-lockup" href={toHref("/")} aria-label="Nearby" data-label="Home">
              <BrandEyes />
            </a>
            <button
              type="button"
              className="icon-btn side-collapse"
              data-label={sidebarRail ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!sidebarRail}
              aria-controls="site-sidebar"
              aria-label={sidebarRail ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => writeSidebarRail(!sidebarRail)}
            >
              <PanelLeft size={18} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          <nav className="side-links">
            {NAV.map((item) => {
              const Icon = item.icon;
              const on = tabActive(path, item.href);
              return (
                <a key={item.href} href={toHref(item.href)} data-label={item.label} aria-current={on ? "page" : undefined}>
                  <Icon size={18} strokeWidth={1.5} aria-hidden />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
          <div className="side-foot">
            <a href={toHref("/profile#saved")} data-label="Saved">
              <Bookmark size={18} strokeWidth={1.5} aria-hidden />
              <span>Saved</span>
            </a>
            <div className="side-profile-row">
              <a href={toHref("/profile")} data-label="Profile" aria-current={tabActive(path, "/profile") ? "page" : undefined}>
                {initial ? <AvatarFace className="tab-avatar" /> : <User size={18} strokeWidth={1.5} aria-hidden />}
                <span>Profile</span>
              </a>
              <ThemeToggle />
            </div>
            <SettingsMenu />
          </div>
        </aside>
        <div className="shell-main">
          <header className={path === "/" ? "mobile-top is-home" : "mobile-top"} data-route={path}>
            <a className="brand-lockup" href={toHref("/")} aria-label="Nearby">
              <BrandEyes />
            </a>
            {path === "/" ? <span className="mobile-title" /> : <p className="mobile-title">{pageTitle(path)}</p>}
            <div className="mobile-actions">
              <ThemeToggle />
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
      <OnNow />
      {more ? (
        <div className="more-layer">
          <button type="button" className="more-scrim" aria-label="Close menu" onClick={() => setMore(false)} />
          <div className="more-panel" role="dialog" aria-label="More">
            <div className="side-brand">
              <a className="brand-lockup" href={toHref("/")} aria-label="Nearby">
                <BrandEyes />
              </a>
            </div>
            <a className="nav-row" href={toHref("/learn")} onClick={() => setMore(false)}>
              <BookOpen size={18} strokeWidth={1.5} aria-hidden />
              <span>Learn AI</span>
            </a>
            <a className="nav-row" href={toHref("/nomad")} onClick={() => setMore(false)}>
              <Compass size={18} strokeWidth={1.5} aria-hidden />
              <span>Digital nomads</span>
            </a>
            <a className="nav-row" href={toHref("/profile#saved")} onClick={() => setMore(false)}>
              <Bookmark size={18} strokeWidth={1.5} aria-hidden />
              <span>Saved</span>
            </a>
            <a className="nav-row" href={toHref("/profile")} onClick={() => setMore(false)}>
              {initial ? <AvatarFace className="tab-avatar" /> : <User size={18} strokeWidth={1.5} aria-hidden />}
              <span>Profile</span>
            </a>
            <SettingsMenu />
          </div>
        </div>
      ) : null}
      <AskDock />
      <IntroSplash />
      <ToastHost />
      <ThemeSync />
      <InstallBridge />
      <RegisterSW />
    </>
  );
}
