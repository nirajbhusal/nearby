import Link from "next/link";
import { SketchPin } from "@/components/illustrations/SketchPin";

export function Nav() {
  return (
    <header className="border-b border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 text-[var(--graphite)]"
        >
          <SketchPin className="h-5 w-5 text-[var(--accent)] transition group-hover:opacity-80" />
          <span className="font-display text-[17px] font-medium tracking-tight">
            Nearby
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[var(--ink-muted)]">
          <Link
            href="/worldwide"
            className="transition hover:text-[var(--graphite)]"
          >
            Worldwide
          </Link>
          <Link
            href="/about"
            className="transition hover:text-[var(--graphite)]"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
