"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AvatarFace } from "@/components/ProfileAvatar";
import { ThemeChoiceControl } from "@/components/ThemeToggle";

const ITEMS = [
  { href: "/profile", label: "Profile" },
  { href: "/profile#saved", label: "Saved" },
  { href: "/profile#settings", label: "Settings" },
  { href: "/about", label: "About" },
] as const;

export function AccountMenu() {
  const pathname = usePathname() || "/";
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const onProfile = pathname.startsWith("/profile");
  const about = pathname.startsWith("/about");

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpenPath(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenPath(null);
        rootRef.current?.querySelector("button")?.focus();
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = [...(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
      if (items.length === 0) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next =
        event.key === "ArrowDown"
          ? items[(index + 1 + items.length) % items.length]
          : items[(index - 1 + items.length) % items.length];
      next?.focus();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        type="button"
        className="avatar-launch"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        onClick={() => setOpenPath(open ? null : pathname)}
      >
        <AvatarFace />
      </button>
      {open ? (
        <div id={menuId} className="account-pop glass-bar" role="menu" aria-label="Account">
          {ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              className="account-item"
              aria-current={
                (item.href === "/about" && about) || (item.href === "/profile" && onProfile) ? "page" : undefined
              }
              onClick={() => setOpenPath(null)}
            >
              {item.label}
            </Link>
          ))}
          <div className="account-theme">
            <span>Theme</span>
            <ThemeChoiceControl compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
