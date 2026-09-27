import NepaliDate from "nepali-date-converter";
import { ktmDay } from "@/lib/nepal/format";

/**
 * The converter's English month for आश्विन is "Aswin"
 * (`new NepaliDate(2054, 5, 24).toString()` → "Friday 24, Aswin 2054").
 * The home line uses the everyday English spelling.
 */
const DISPLAY_MONTH: Record<string, string> = {
  Aswin: "Asoj",
};

export type NepalClockParts = {
  weekday: string;
  day: string;
  month: string;
  hour: string;
  minute: string;
  ampm: string;
  ad: string;
  bs: string;
  line: string;
};

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((item) => item.type === type)?.value ?? "";
}

/** Gregorian line in Asia/Kathmandu, e.g. "Sunday, 27 Sep · 9:52 AM". */
export function formatNepalAd(date: Date): Pick<NepalClockParts, "weekday" | "day" | "month" | "hour" | "minute" | "ampm" | "ad"> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
  }).formatToParts(date);
  const weekday = part(parts, "weekday");
  const day = part(parts, "day");
  const month = part(parts, "month");
  const hour = part(parts, "hour");
  const minute = part(parts, "minute");
  const ampm = part(parts, "dayPeriod").toUpperCase();
  const ad = `${weekday}, ${day} ${month} · ${hour}:${minute} ${ampm}`;
  return { weekday, day, month, hour, minute, ampm, ad };
}

/** Bikram Sambat label in English, e.g. "Asoj 11, 2083 BS". */
export function formatBikram(date: Date): string {
  const [year, month, day] = ktmDay(date).split("-").map(Number);
  const bs = NepaliDate.fromAD(new Date(year, month - 1, day));
  const libraryName = bs.format("MMMM", "en");
  const name = DISPLAY_MONTH[libraryName] ?? libraryName;
  return `${name} ${bs.getDate()}, ${bs.getYear()} BS`;
}

export function nepalClockParts(date = new Date()): NepalClockParts {
  const ad = formatNepalAd(date);
  const bs = formatBikram(date);
  return { ...ad, bs, line: `${ad.ad} · ${bs}` };
}

/** Widest clock line, reserved during SSR so the live text does not shift the greeting. */
export const NPT_CLOCK_SIZER = "Wednesday, 30 Sep · 12:00 PM · Shrawan 30, 2083 BS";
