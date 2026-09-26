"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { resolvePlace, suggestPlaces } from "@/lib/nepal/places";

export function HomeSearch() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => suggestPlaces(draft, 6), [draft]);

  function go(label: string, section: "charge" | "jobs" | "events" = "charge") {
    const hit = resolvePlace(label) ?? suggestions[0];
    if (!hit) return;
    const path = section === "charge" ? "/charge" : section === "jobs" ? "/jobs" : "/events";
    router.push(`${path}?q=${encodeURIComponent(hit.label)}`);
  }

  return (
    <form
      className="home-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.trim()) {
          router.push("/charge");
          return;
        }
        if (!suggestions[0] && !resolvePlace(draft)) return;
        go(draft);
      }}
    >
      <label className="sr-only" htmlFor="home-search">
        Search chargers, jobs, events
      </label>
      <div className="home-search-field glass-bar">
        <Search size={18} aria-hidden />
        <input
          id="home-search"
          value={draft}
          placeholder="Search chargers, jobs, events"
          autoComplete="off"
          onChange={(event) => {
            setDraft(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && draft.trim() && suggestions.length > 0 ? (
        <ul className="suggest-list">
          {suggestions.map((hit) => (
            <li key={`${hit.kind}-${hit.label}`}>
              <button type="button" onClick={() => go(hit.label)}>
                <span>{hit.label}</span>
                <span className="suggest-kind">{hit.kind}</span>
              </button>
              <span className="suggest-jumps">
                <button type="button" onClick={() => go(hit.label, "jobs")}>
                  Jobs
                </button>
                <button type="button" onClick={() => go(hit.label, "events")}>
                  Events
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
