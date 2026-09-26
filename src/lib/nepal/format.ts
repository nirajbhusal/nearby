import type { EvPlug } from "@/lib/nepal/types";

export const DATA_UPDATED_ISO = "2026-09-26";
export const DATA_UPDATED_LABEL = "26 Sep 2026";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatUpdated(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return iso;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function formatKm(km: number): string {
  if (!Number.isFinite(km)) return "";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Drop raw directory ids. The sheet should name the directory, not a UUID. */
export function sourceLabel(name: string): string {
  if (/ev nepal directory/i.test(name)) return "EV Nepal directory";
  if (/aircharge/i.test(name)) return "AirCharge directory";
  if (/techmandu/i.test(name)) return "Techmandu list";
  return name.replace(/, (station|location) id .+$/i, "");
}

export function speedLabel(speed: string): string {
  if (speed === "fast") return "Fast DC";
  if (speed === "slow") return "Slow AC";
  return "Speed not listed";
}

function trimKw(kw: number): string {
  return Number.isInteger(kw) ? String(kw) : String(Math.round(kw * 10) / 10);
}

export function plugLine(plugs: EvPlug[]): string {
  if (!plugs.length) return "Connectors not listed";
  return plugs
    .map((p) => {
      const bits = [p.type];
      if (p.kw) bits.push(`${trimKw(p.kw)} kW`);
      if (p.n > 1) bits.push(`× ${p.n}`);
      return bits.join(" ");
    })
    .join(" · ");
}

export function accessCopy(access: string): { short: string; long: string } {
  if (access === "public") {
    return {
      short: "Listed as public",
      long: "A source lists this station as public. That can still change — call ahead if the trip depends on it.",
    };
  }
  if (access === "customers") {
    return {
      short: "Customers only",
      long: "A source says this charger is for customers, not open public access.",
    };
  }
  return {
    short: "Access not confirmed; call ahead",
    long: "Access is not confirmed. Dealer, hotel, and workplace chargers are often closed to the public. Call ahead.",
  };
}

export function stationCaution(
  name: string,
  notes: string | null | undefined
): string | null {
  const blob = `${notes ?? ""} ${name}`.toLowerCase();
  if (blob.includes("coming soon")) {
    return "A source lists this station as coming soon.";
  }
  if (
    blob.includes("e-rickshaw") ||
    blob.includes("private residence") ||
    blob.includes("private point")
  ) {
    return "This may be a small or private charging point, not a public car station.";
  }
  if ((notes ?? "").toLowerCase().includes("surunga")) {
    return "The mapped point may sit outside the town in the name. Call ahead.";
  }
  return null;
}

/** `tel:` href, or null when the value is not a usable number. */
export function phoneHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed || trimmed === "-") return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return null;
  if (trimmed.startsWith("+")) return `tel:+${digits}`;
  if (digits.startsWith("977")) return `tel:+${digits}`;
  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  return `tel:+977${local}`;
}

export function googleMapsDir(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function appleMapsDir(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}`;
}

export function ktmDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatWhen(startIso: string, endIso: string | null): string {
  const start = new Date(startIso);
  const day: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kathmandu",
    month: "short",
    day: "numeric",
  };
  const startLabel = new Intl.DateTimeFormat("en-GB", day).format(start);
  if (!endIso) {
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kathmandu",
      hour: "numeric",
      minute: "2-digit",
    }).format(start);
    return `${startLabel} · ${time} NPT`;
  }
  const end = new Date(endIso);
  if (ktmDay(start) === ktmDay(end)) {
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kathmandu",
      hour: "numeric",
      minute: "2-digit",
    }).format(start);
    return `${startLabel} · ${time} NPT`;
  }
  const endLabel = new Intl.DateTimeFormat("en-GB", {
    ...day,
    year: "numeric",
  }).format(end);
  return `${startLabel} – ${endLabel}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  "software-services": "Software",
  "ai-data": "AI & data",
  fintech: "Fintech",
  "saas-product": "SaaS",
  "e-commerce": "Commerce",
  "telecom-isp": "Telecom",
  cybersecurity: "Security",
  mobility: "Mobility",
  "research-nonprofit": "Research",
  healthtech: "Health",
  "consumer-app": "Consumer",
  "ev-mobility": "EV",
  logistics: "Logistics",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

const LEARN_TYPE_LABELS: Record<string, string> = {
  university: "University",
  college: "College",
  bootcamp: "Bootcamp",
  training: "Training",
  community: "Community",
  research_lab: "Research lab",
  online: "Online",
};

export function learnTypeLabel(type: string): string {
  return LEARN_TYPE_LABELS[type] ?? type;
}

const MODE_LABELS: Record<string, string> = {
  in_person: "In person",
  online: "Online",
  hybrid: "Hybrid",
};

export function modeLabel(mode: string | null): string {
  if (!mode) return "Mode not listed";
  return MODE_LABELS[mode] ?? mode;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  meetup: "Meetup",
  hackathon: "Hackathon",
  conference: "Conference",
  workshop: "Workshop",
  networking: "Networking",
  talk: "Talk",
  other: "Other",
};

export function eventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
