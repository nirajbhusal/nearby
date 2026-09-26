import { formatKm } from "@/lib/nepal/format";

export const PROFILE_KEY = "nearby-profile";
export const SAVED_KEY = "nearby-saved";
export const UNITS_KEY = "nearby-units";
export const THEME_CHOICE_KEY = "nearby-theme-choice";
export const THEME_KEY = "nearby-theme";

export const LOCAL_DATA_KEYS = [
  PROFILE_KEY,
  SAVED_KEY,
  UNITS_KEY,
  THEME_CHOICE_KEY,
  THEME_KEY,
  "nearby-recent-places",
  "nearby-install-dismissed",
] as const;

export type ThemeChoice = "auto" | "system" | "light" | "dark";
export type DistanceUnit = "km" | "mi";
export type ConnectorId = "ccs2" | "gbt" | "chademo" | "t2";
export type SavedKind = "charger" | "job" | "event" | "stay" | "cowork";

export type Profile = {
  name: string;
  color: string;
  homeCity: string | null;
  evOn: boolean;
  connectors: ConnectorId[];
  fastCharge: boolean;
  jobInterests: string[];
  eventInterests: string[];
};

export type SavedRecord = {
  id: string;
  kind: SavedKind;
  title: string;
  subtitle: string;
  href: string;
};

export const AVATAR_COLORS = ["#0b6e56", "#0077a8", "#5b4b8a", "#9a3412", "#1d4e89", "#3f6212"] as const;

export const CONNECTOR_OPTIONS: { id: ConnectorId; label: string }[] = [
  { id: "ccs2", label: "CCS2" },
  { id: "gbt", label: "GB/T" },
  { id: "chademo", label: "CHAdeMO" },
  { id: "t2", label: "Type 2" },
];

export const HOME_CITY_OPTIONS = [
  "Kathmandu",
  "Lalitpur",
  "Pokhara",
  "Bharatpur",
  "Butwal",
  "Biratnagar",
  "Birgunj",
  "Dhangadhi",
] as const;

export const JOB_INTERESTS: { id: string; label: string }[] = [
  { id: "engineering", label: "Engineering" },
  { id: "data-ai", label: "Data / AI" },
  { id: "design", label: "Design" },
  { id: "product", label: "Product" },
  { id: "security", label: "Security" },
];

export const EVENT_INTERESTS: { id: string; label: string }[] = [
  { id: "ai", label: "AI" },
  { id: "web", label: "Web" },
  { id: "cloud", label: "Cloud" },
  { id: "security", label: "Security" },
];

export const EMPTY_PROFILE: Profile = {
  name: "",
  color: AVATAR_COLORS[0],
  homeCity: null,
  evOn: false,
  connectors: [],
  fastCharge: false,
  jobInterests: [],
  eventInterests: [],
};

const CONNECTORS = new Set<string>(CONNECTOR_OPTIONS.map((item) => item.id));

export function profileInitial(name: string): string {
  const letter = name.trim().replace(/[^A-Za-z0-9]/g, "").charAt(0);
  return letter ? letter.toUpperCase() : "";
}

export function evReady(profile: Profile): boolean {
  return profile.evOn && profile.connectors.length > 0;
}

function asStringList(value: unknown, allowed?: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  const next: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || (allowed && !allowed.has(item))) continue;
    if (!next.includes(item)) next.push(item);
  }
  return next;
}

export function parseProfile(raw: string | null): Profile {
  if (!raw) return EMPTY_PROFILE;
  try {
    const data = JSON.parse(raw) as Partial<Profile>;
    const color = AVATAR_COLORS.includes(data.color as (typeof AVATAR_COLORS)[number])
      ? (data.color as string)
      : EMPTY_PROFILE.color;
    const homeCity =
      typeof data.homeCity === "string" &&
      (HOME_CITY_OPTIONS as readonly string[]).includes(data.homeCity)
        ? data.homeCity
        : null;
    return {
      name: typeof data.name === "string" ? data.name.slice(0, 80) : "",
      color,
      homeCity,
      evOn: data.evOn === true,
      connectors: asStringList(data.connectors, CONNECTORS) as ConnectorId[],
      fastCharge: data.fastCharge === true,
      jobInterests: asStringList(data.jobInterests, new Set(JOB_INTERESTS.map((item) => item.id))),
      eventInterests: asStringList(
        data.eventInterests,
        new Set(EVENT_INTERESTS.map((item) => item.id)),
      ),
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

export function parseSaved(raw: string | null): SavedRecord[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const rows: SavedRecord[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") continue;
      const row = item as Partial<SavedRecord>;
      if (
        typeof row.id !== "string" ||
        typeof row.title !== "string" ||
        typeof row.href !== "string" ||
        (row.kind !== "charger" &&
          row.kind !== "job" &&
          row.kind !== "event" &&
          row.kind !== "stay" &&
          row.kind !== "cowork")
      ) {
        continue;
      }
      rows.push({
        id: row.id,
        kind: row.kind,
        title: row.title,
        subtitle: typeof row.subtitle === "string" ? row.subtitle : "",
        href: row.href,
      });
    }
    return rows;
  } catch {
    return [];
  }
}

export function savedCounts(items: SavedRecord[]) {
  return {
    charger: items.filter((item) => item.kind === "charger").length,
    job: items.filter((item) => item.kind === "job").length,
    event: items.filter((item) => item.kind === "event").length,
    stay: items.filter((item) => item.kind === "stay").length,
    cowork: items.filter((item) => item.kind === "cowork").length,
  };
}

type PlugLike = { type: string };

function plugId(type: string): ConnectorId | null {
  if (type === "CCS2") return "ccs2";
  if (type.startsWith("GB/T")) return "gbt";
  if (type === "Type 2") return "t2";
  if (/chademo/i.test(type)) return "chademo";
  return null;
}

function isAcPlug(type: string): boolean {
  return type === "Type 2" || type === "GB/T AC";
}

/** A station fits when one selected connector is present. AC-only cars skip DC-only plugs. */
export function stationFitsEv(
  station: { speed: string; plugs: PlugLike[] },
  profile: Profile,
): boolean {
  if (!evReady(profile)) return false;
  const matched = station.plugs.filter((plug) => {
    const id = plugId(plug.type);
    return id != null && profile.connectors.includes(id);
  });
  if (matched.length === 0) return false;
  if (profile.fastCharge) return true;
  return matched.some((plug) => isAcPlug(plug.type));
}

function jobHit(id: string, card: { title: string; category: string }): boolean {
  const title = card.title;
  if (id === "engineering") {
    return /engineer|developer|software|full[- ]?stack|backend|frontend|mobile|devops/i.test(title);
  }
  if (id === "data-ai") {
    return card.category === "ai-data" || /\bdata\b|\bai\b|machine learning|\bml\b/i.test(title);
  }
  if (id === "design") return /design|\bux\b|\bui\b/i.test(title);
  if (id === "product") return /product|program manager/i.test(title);
  if (id === "security") return card.category === "cybersecurity" || /security|cyber/i.test(title);
  return false;
}

export function jobInterestMatch(card: { title: string; category: string }, interests: string[]): boolean {
  return interests.some((id) => jobHit(id, card));
}

function eventHit(id: string, topics: string[]): boolean {
  const blob = topics.join(" ");
  if (id === "ai") return /\bai\b|machine learning|\bllm/i.test(blob);
  if (id === "web") return /web|flutter|android/i.test(blob);
  if (id === "cloud") return /cloud|aws|azure|devops|kubernetes/i.test(blob);
  if (id === "security") return /security|cyber|\bctf\b/i.test(blob);
  return false;
}

export function eventInterestMatch(topics: string[], interests: string[]): boolean {
  return interests.some((id) => eventHit(id, topics));
}

/** Matching rows first. Order inside each group stays as it was. */
export function preferMatches<T>(rows: T[], interests: string[], match: (row: T) => boolean): T[] {
  if (interests.length === 0) return rows;
  const yes: T[] = [];
  const no: T[] = [];
  for (const row of rows) (match(row) ? yes : no).push(row);
  return yes.length === 0 ? rows : [...yes, ...no];
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  if (!Number.isFinite(km)) return "";
  if (unit === "mi") {
    const miles = km * 0.621371;
    if (miles < 10) return `${miles.toFixed(1)} mi`;
    return `${Math.round(miles)} mi`;
  }
  return formatKm(km);
}

export function readThemeChoice(): ThemeChoice {
  if (typeof window === "undefined") return "auto";
  try {
    const choice = localStorage.getItem(THEME_CHOICE_KEY);
    if (choice === "auto" || choice === "light" || choice === "dark" || choice === "system") return choice;
    const legacy = localStorage.getItem(THEME_KEY);
    if (legacy === "light" || legacy === "dark") return legacy;
  } catch {
    /* private mode */
  }
  return "auto";
}

export function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice === "light" || choice === "dark") return choice;
  if (choice === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return "dark";
}
