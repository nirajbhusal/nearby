"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ViewTransition } from "react";
import { Briefcase, Calendar, House, User, Zap } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { InstallBridge } from "@/components/InstallPrompt";
import { AvatarFace, ProfileAvatar } from "@/components/ProfileAvatar";
import { RegisterSW } from "@/components/RegisterSW";
import { ThemeSync } from "@/components/ThemeToggle";
import { profileInitial } from "@/lib/local-profile";
import { useProfile } from "@/lib/profile-store";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/charge", label: "Charge", icon: Zap },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/events", label: "Events", icon: Calendar },
] as const;

const DESKTOP = [
  { href: "/", label: "Home" },
  { href: "/charge", label: "Charge" },
  { href: "/jobs", label: "Jobs" },
  { href: "/events", label: "Events" },
  { href: "/learn", label: "Learn" },
  { href: "/nomad", label: "Nomad" },
] as const;

function active(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/charge") return pathname.startsWith("/charge") || pathname.startsWith("/ev");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ProfileTabMark() {
  const profile = useProfile();
  const initial = profileInitial(profile.name);
  if (!initial) return <User size={22} strokeWidth={2} aria-hidden />;
  return <AvatarFace className="tab-avatar" />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const charge = pathname.startsWith("/charge");
  const onProfile = pathname.startsWith("/profile");

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
        </nav>
        <ProfileAvatar current={onProfile} />
      </header>
      <div className="mobile-bar glass-bar">
        <Link href="/" className="brand">
          <Wordmark />
        </Link>
        <ProfileAvatar current={onProfile} />
      </div>
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
        <Link href="/profile" transitionTypes={["nav-forward"]} aria-current={onProfile ? "page" : undefined}>
          <ProfileTabMark />
          <span>Profile</span>
        </Link>
      </nav>
      <ThemeSync />
      <InstallBridge />
      <RegisterSW />
    </>
  );
}
