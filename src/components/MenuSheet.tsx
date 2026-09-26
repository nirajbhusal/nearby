"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  BookOpen,
  Briefcase,
  Calendar,
  Compass,
  Download,
  House,
  Info,
  Share,
  User,
  Zap,
} from "lucide-react";
import { profileInitial, savedCounts } from "@/lib/local-profile";
import { clearLocalData, useProfile, useSaved, writeUnits, useUnits } from "@/lib/profile-store";
import { useInstallOffer } from "@/components/InstallPrompt";
import { ThemeChoiceControl } from "@/components/ThemeToggle";

const SECTIONS = [
  { href: "/", label: "Home", detail: "Map, chargers, and what’s nearby", icon: House },
  { href: "/charge", label: "Charge", detail: "EV stations across Nepal", icon: Zap },
  { href: "/jobs", label: "Jobs", detail: "Open tech roles", icon: Briefcase },
  { href: "/events", label: "Events", detail: "Meetups and conferences", icon: Calendar },
  { href: "/learn", label: "Learn", detail: "Places to study AI", icon: BookOpen },
  { href: "/nomad", label: "Nomad", detail: "Kathmandu and Pokhara", icon: Compass },
  { href: "/about", label: "About", detail: "Sources and how Nearby works", icon: Info },
] as const;

function active(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/charge") return pathname.startsWith("/charge") || pathname.startsWith("/ev");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MenuSheet({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const profile = useProfile();
  const saved = useSaved();
  const counts = savedCounts(saved);
  const units = useUnits();
  const install = useInstallOffer();
  const [clearArmed, setClearArmed] = useState(false);
  const initial = profileInitial(profile.name);
  const name = profile.name.trim() || "Your profile";

  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      [...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea")].filter(
        (node) => !node.hasAttribute("disabled") && node.tabIndex !== -1,
      );
    const first = focusable()[0];
    first?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const start = items[0];
      const end = items[items.length - 1];
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault();
        end.focus();
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault();
        start.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="menu-sheet">
      <button type="button" className="menu-backdrop" tabIndex={-1} aria-label="Close menu" onClick={onClose} />
      <div
        ref={panelRef}
        className="menu-panel glass-bar"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="menu-panel-top">
          <h2 id={titleId} className="sr-only">
            Menu
          </h2>
          <button type="button" className="text-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <Link href="/profile" className="profile-card" onClick={onClose}>
          <span className="avatar-face" style={{ background: profile.color }} aria-hidden>
            {initial || <User size={18} strokeWidth={2.2} />}
          </span>
          <span>
            <strong>{name}</strong>
            <span>Edit profile</span>
          </span>
        </Link>

        <section className="settings-group" aria-labelledby="menu-sections">
          <h3 id="menu-sections">All sections</h3>
          <div className="settings-list">
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              const current = active(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="settings-row"
                  aria-current={current ? "page" : undefined}
                  transitionTypes={["nav-forward"]}
                  onClick={onClose}
                >
                  <Icon size={20} strokeWidth={1.9} aria-hidden />
                  <span className="settings-copy">
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="settings-group" aria-labelledby="menu-saved">
          <h3 id="menu-saved">Saved</h3>
          <div className="settings-list">
            <Link href="/profile#saved" className="settings-row" onClick={onClose}>
              <span className="settings-copy">
                <strong>Chargers</strong>
                <small>{counts.charger} saved</small>
              </span>
            </Link>
            <Link href="/profile#saved" className="settings-row" onClick={onClose}>
              <span className="settings-copy">
                <strong>Jobs</strong>
                <small>{counts.job} saved</small>
              </span>
            </Link>
            <Link href="/profile#saved" className="settings-row" onClick={onClose}>
              <span className="settings-copy">
                <strong>Events</strong>
                <small>{counts.event} saved</small>
              </span>
            </Link>
          </div>
        </section>

        <section className="settings-group" aria-labelledby="menu-settings">
          <h3 id="menu-settings">Settings</h3>
          <div className="settings-list">
            <div className="settings-row settings-stack">
              <span className="settings-copy">
                <strong>Theme</strong>
                <small>System, light, or dark</small>
              </span>
              <ThemeChoiceControl compact />
            </div>
            <div className="settings-row settings-stack">
              <span className="settings-copy">
                <strong>Distance</strong>
              </span>
              <div className="segment segment-compact" role="group" aria-label="Distance units">
                <button type="button" aria-pressed={units === "km"} onClick={() => writeUnits("km")}>
                  Kilometres
                </button>
                <button type="button" aria-pressed={units === "mi"} onClick={() => writeUnits("mi")}>
                  Miles
                </button>
              </div>
            </div>
            <button
              type="button"
              className="settings-row settings-danger"
              onClick={() => (clearArmed ? clearLocalData() : setClearArmed(true))}
            >
              <span className="settings-copy">
                <strong>{clearArmed ? "Confirm clear" : "Clear local data"}</strong>
                <small>
                  {clearArmed
                    ? "This removes the profile, saved items, theme, and recent places on this device"
                    : "Profile, saved items, theme, and recent places on this device"}
                </small>
              </span>
            </button>
          </div>
        </section>

        {install.mode !== "none" ? (
          <section className="settings-group" aria-label="Install">
            <div className="settings-list">
              {install.mode === "prompt" ? (
                <button
                  type="button"
                  className="settings-row"
                  onClick={() => {
                    void install.install();
                  }}
                >
                  <Download size={20} strokeWidth={1.9} aria-hidden />
                  <span className="settings-copy">
                    <strong>Install app</strong>
                    <small>Add Nearby to this device</small>
                  </span>
                </button>
              ) : (
                <p className="settings-row">
                  <Share size={20} strokeWidth={1.9} aria-hidden />
                  <span className="settings-copy">
                    <strong>Install app</strong>
                    <small>Use Share, then Add to Home Screen</small>
                  </span>
                </p>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
