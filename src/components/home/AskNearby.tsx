"use client";

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { SceneArt } from "@/components/illustrations/Scenes";
import { toHref } from "@/components/SiteLink";
import { evIndex } from "@/lib/nepal/ev";
import { nepalEvents } from "@/lib/nepal/events";
import { nepalCompanies } from "@/lib/nepal/jobs";
import { learnPlaces } from "@/lib/nepal/learn";
import { NOMAD_INDEX } from "@/lib/nepal/nomad-shared";

type Group = "Chargers" | "Jobs" | "Events" | "Learn" | "Nomad";

type Hit = { group: Group; title: string; meta: string; href: string };

const PLACES = ["Near me", "Kathmandu", "Pokhara"] as const;

function includes(value: string | null | undefined, needle: string): boolean {
  return (value || "").toLowerCase().includes(needle);
}

const INTENT = /^(chargers?|plugs?|fast|stations?|ev|jobs?|roles?|hiring|work|events?|meetups?|week|conference|learn|courses?|nearby|nomad|cowork(?:ing)?|cafes?|stays?)$/;

function searchAll(query: string, place: string): Hit[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  const city = place === "Near me" ? "" : place.toLowerCase();
  const tokens = needle.split(/[^a-z0-9+]+/).filter((token) => token.length >= 2 && token !== "near" && token !== "the");
  const words = tokens.filter((token) => !INTENT.test(token));
  const charge = tokens.some((token) => /charg|plug|ccs|fast|station|^ev$/.test(token));
  const job = tokens.some((token) => /job|role|hiring|work|^ai$/.test(token));
  const event = tokens.some((token) => /event|meetup|week|conference/.test(token));
  const learn = tokens.some((token) => /learn|course|univers|bootcamp|^ai$/.test(token));
  const nomad = tokens.some((token) => /nomad|cowork|cafe|stay|pokhara|kathmandu/.test(token));
  const broad = !charge && !job && !event && !learn && !nomad;
  const textHit = (blob: string) => (words.length === 0 ? true : words.some((word) => blob.includes(word)));
  const inCity = (blob: string) => !city || blob.includes(city);
  const hits: Hit[] = [];

  if (charge || broad) {
    for (const station of evIndex) {
      const blob = `${station.name} ${station.city ?? ""} ${station.address ?? ""} ${station.network ?? ""} ${station.speed}`.toLowerCase();
      if (!inCity(blob) || !textHit(blob)) continue;
      hits.push({
        group: "Chargers",
        title: station.name,
        meta: [station.city, station.speed].filter(Boolean).join(" · "),
        href: `/ev/${station.id}`,
      });
      if (hits.length >= 4) break;
    }
  }

  if (job || broad) {
    let count = 0;
    for (const company of nepalCompanies) {
      const office = company.offices.find((item) => !city || includes(item.city, city)) ?? (city ? null : company.offices[0]);
      if (!office && city) continue;
      const blob = `${company.name} ${company.category} ${office?.city ?? ""} ${company.open_roles.map((item) => item.title).join(" ")}`.toLowerCase();
      if (!textHit(blob)) continue;
      const role = company.open_roles.find((item) => words.length === 0 || words.some((word) => item.title.toLowerCase().includes(word)));
      hits.push({
        group: "Jobs",
        title: role?.title || company.name,
        meta: [company.name, office?.city].filter(Boolean).join(" · "),
        href: `/jobs?q=${encodeURIComponent(office?.city || "Kathmandu")}${company.category ? `&category=${company.category}` : ""}`,
      });
      count += 1;
      if (count >= 4) break;
    }
  }

  if (event || broad) {
    let count = 0;
    for (const item of nepalEvents) {
      const blob = `${item.title} ${item.city ?? ""} ${item.organizer ?? ""} ${item.type}`.toLowerCase();
      if (!inCity(blob) || !textHit(blob)) continue;
      hits.push({
        group: "Events",
        title: item.title,
        meta: [item.city, item.organizer].filter(Boolean).join(" · "),
        href: `/events?q=${encodeURIComponent(item.city || "Kathmandu")}`,
      });
      count += 1;
      if (count >= 4) break;
    }
  }

  if (learn || broad) {
    let count = 0;
    for (const placeRow of learnPlaces) {
      const blob = `${placeRow.name} ${placeRow.city ?? ""} ${placeRow.type} ${placeRow.programs.map((item) => item.title).join(" ")}`.toLowerCase();
      if (!inCity(blob) || !textHit(blob)) continue;
      hits.push({
        group: "Learn",
        title: placeRow.name,
        meta: [placeRow.city, placeRow.type].filter(Boolean).join(" · "),
        href: `/learn?q=${encodeURIComponent(placeRow.city || "Kathmandu")}`,
      });
      count += 1;
      if (count >= 3) break;
    }
  }

  if (nomad || broad) {
    for (const cityGuide of NOMAD_INDEX) {
      const blob = `${cityGuide.name} ${cityGuide.shortName} ${cityGuide.headline}`.toLowerCase();
      if (!inCity(blob) || (!textHit(blob) && !nomad)) continue;
      if (nomad && words.length > 0 && !textHit(blob)) continue;
      hits.push({
        group: "Nomad",
        title: cityGuide.shortName,
        meta: cityGuide.headline || "City guide",
        href: `/nomad/${cityGuide.slug}`,
      });
    }
  }

  return hits;
}

const GROUPS: Group[] = ["Chargers", "Jobs", "Events", "Learn", "Nomad"];

export function AskNearby() {
  const [draft, setDraft] = useState("");
  const [place, setPlace] = useState<(typeof PLACES)[number]>("Near me");
  const [openPlaces, setOpenPlaces] = useState(false);
  const hits = useMemo(() => searchAll(draft, place), [draft, place]);
  const grouped = GROUPS.map((group) => ({ group, rows: hits.filter((hit) => hit.group === group) })).filter(
    (entry) => entry.rows.length > 0,
  );

  return (
    <form className="composer" role="search" onSubmit={(event) => event.preventDefault()}>
      <label className="sr-only" htmlFor="ask-nearby">
        Ask Nearby
      </label>
      <div className="composer-bar">
        <Search size={20} strokeWidth={1.5} aria-hidden />
        <input
          id="ask-nearby"
          value={draft}
          placeholder="Ask Nearby… chargers, jobs, events, places to work"
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="place-chip-wrap">
          <button type="button" className="place-chip" aria-expanded={openPlaces} onClick={() => setOpenPlaces((value) => !value)}>
            <MapPin size={16} strokeWidth={1.5} aria-hidden />
            {place}
          </button>
          {openPlaces ? (
            <ul className="place-menu">
              {PLACES.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => {
                      setPlace(item);
                      setOpenPlaces(false);
                    }}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      {draft.trim().length >= 2 ? (
        <div className="composer-results" aria-live="polite">
          {grouped.length === 0 ? (
            <p className="empty-inline">Nothing matched. Try “charger”, “AI”, or a city name.</p>
          ) : (
            grouped.map((entry) => (
              <section key={entry.group}>
                <h2>{entry.group}</h2>
                <ul>
                  {entry.rows.map((hit) => (
                    <li key={`${hit.group}-${hit.title}-${hit.href}`}>
                      <a href={toHref(hit.href)}>
                        <strong>{hit.title}</strong>
                        <small>{hit.meta}</small>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      ) : null}
    </form>
  );
}

export function PromptCard({
  href,
  title,
  scene,
}: {
  href: string;
  title: string;
  scene: "charge" | "jobs" | "events" | "learn" | "nomad" | "pokhara" | "kathmandu";
}) {
  return (
    <a className="prompt-card" href={toHref(href)}>
      <SceneArt scene={scene === "pokhara" ? "pokhara" : scene} />
      <span>{title}</span>
    </a>
  );
}
