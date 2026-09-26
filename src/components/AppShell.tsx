"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, Briefcase, Calendar, House, User, Zap } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { InstallBridge } from "@/components/InstallPrompt";
import { AvatarFace } from "@/components/ProfileAvatar";
import { RegisterSW } from "@/components/RegisterSW";
import { toHref } from "@/components/SiteLink";
import { SITE_TAGLINE } from "@/lib/site";
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

function ProfileTabMark() {
  const profile = useProfile();
  const initial = profileInitial(profile.name);
  if (!initial) return <User size={18} strokeWidth={2} aria-hidden />;
  return <AvatarFace className="tab-avatar" />;
}

function BrandLockup() {
  return (
    <a className="brand-lockup" href={toHref("/")}>
      <Wordmark />
      <span className="brand-tag">{SITE_TAGLINE}</span>
    </a>
  );
}

function OfflineNote() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== "undefined" && navigator.onLine === false);
    sync();
    window.addEventListener("offline", sync);
    window.addEventListener("online", sync);
    return () => {
      window.removeEventListener("offline", sync);
      window.removeEventListener("online", sync);
    };
  }, []);
  if (!offline) return null;
  return (
    <p className="offline-note" role="status">
      You’re offline. Pages you’ve opened recently still load.
    </p>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const charge = pathname.startsWith("/charge");

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "auto";
    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", inline: "nearest" });
      }, 280);
    }
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="top-nav">
        <BrandLockup />
        <nav aria-label="Sections">
          {DESKTOP.map((tab) => (
            <a key={tab.href} href={toHref(tab.href)} aria-current={active(pathname, tab.href) ? "page" : undefined}>
              {tab.label}
            </a>
          ))}
        </nav>
      </header>
      <div className="mobile-bar">
        <BrandLockup />
      </div>
      <OfflineNote />
      <div id="content" className={charge ? "charge-frame" : "page-frame"}>
        {children}
      </div>
      <nav className="tab-bar" aria-label="Sections">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const on = active(pathname, tab.href);
          return (
            <a key={tab.href} href={toHref(tab.href)} aria-current={on ? "page" : undefined}>
              {tab.href === "/profile" ? <ProfileTabMark /> : <Icon size={18} strokeWidth={2} aria-hidden />}
              <span>{tab.label}</span>
            </a>
          );
        })}
      </nav>
      <ThemeSync />
      <InstallBridge />
      <RegisterSW />
    </>
  );
}
