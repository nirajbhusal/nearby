import type { ThemeChoice } from "@/lib/local-profile";

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export function isDayPeriod(value: string | null | undefined): value is DayPeriod {
  return value === "morning" || value === "afternoon" || value === "evening" || value === "night";
}

/** Hour in Asia/Kathmandu, or the device clock if that zone is unavailable. */
export function kathmanduHour(date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const hour = parts.find((part) => part.type === "hour")?.value;
    const parsed = hour ? Number.parseInt(hour, 10) : Number.NaN;
    if (Number.isFinite(parsed)) return parsed;
  } catch {
    /* fall through */
  }
  return date.getHours();
}

export function periodFromHour(hour: number): DayPeriod {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}

export function currentPeriod(date = new Date()): DayPeriod {
  return periodFromHour(kathmanduHour(date));
}

export function greetingFor(period: DayPeriod): string {
  if (period === "morning") return "Good morning";
  if (period === "afternoon") return "Good afternoon";
  if (period === "evening") return "Good evening";
  return "Good night";
}

export function themeForPeriod(period: DayPeriod): "light" | "dark" {
  return period === "morning" || period === "afternoon" ? "light" : "dark";
}

export function readTodQuery(): DayPeriod | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("tod");
  return isDayPeriod(value) ? value : null;
}

export function msUntilNextBoundary(date = new Date()): number {
  const hour = kathmanduHour(date);
  const marks = [5, 11, 16, 19, 29];
  const next = marks.find((mark) => mark > hour) ?? 29;
  const minutes = 60 - date.getMinutes();
  const seconds = 60 - date.getSeconds();
  const hoursLeft = Math.max(0, next - hour - 1);
  return Math.max(15000, (hoursLeft * 60 + minutes) * 60 * 1000 + seconds * 1000);
}

type Paint = {
  period: DayPeriod;
  theme: "light" | "dark";
  atmosphere: DayPeriod | "plain";
  greeting: string;
};

function computePaint(choice: ThemeChoice, _ignoreQuery: boolean): Paint {
  const period = currentPeriod();
  const greeting = greetingFor(period);
  const theme =
    choice === "light" || choice === "dark"
      ? choice
      : typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
  return { period, theme, atmosphere: "plain", greeting };
}

const THEME_COLOR = { light: "#ffffff", dark: "#0a0a0a" } as const;

/** Browser chrome follows an explicit choice, and the system when that choice is cleared. */
export function syncBrowserChrome(theme: "light" | "dark", choice: ThemeChoice) {
  if (typeof document === "undefined") return;
  const explicit = choice === "light" || choice === "dark";
  const root = document.documentElement;
  root.style.colorScheme = theme;
  let scheme = document.querySelector('meta[name="color-scheme"]');
  if (!scheme) {
    scheme = document.createElement("meta");
    scheme.setAttribute("name", "color-scheme");
    document.head.appendChild(scheme);
  }
  scheme.setAttribute("content", explicit ? theme : "light dark");
  const override = document.querySelector('meta[name="theme-color"][data-theme-override]');
  if (explicit) {
    const meta = override ?? document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("data-theme-override", "1");
    meta.setAttribute("content", THEME_COLOR[theme]);
    meta.removeAttribute("media");
    if (!meta.parentNode) document.head.appendChild(meta);
  } else if (override) {
    override.remove();
  }
}

/** Apply the theme and time-of-day atmosphere. Returns true when the look changed. */
export function paintTheme(choice: ThemeChoice, opts?: { ignoreQuery?: boolean; fade?: boolean }): boolean {
  if (typeof document === "undefined") return false;
  const stored = choice === "auto" ? "system" : choice;
  const next = computePaint(stored, opts?.ignoreQuery === true);
  const root = document.documentElement;
  const changed =
    root.dataset.theme !== next.theme ||
    root.dataset.atmosphere !== next.atmosphere ||
    root.dataset.tod !== next.period ||
    root.dataset.greeting !== next.greeting;
  const apply = () => {
    root.dataset.theme = next.theme;
    root.dataset.themeChoice = stored;
    root.dataset.atmosphere = "plain";
    root.dataset.tod = next.period;
    root.dataset.greeting = next.greeting;
    root.dataset.todLock = "";
    syncBrowserChrome(next.theme, stored);
    if (changed) {
      window.dispatchEvent(new Event("nearby-theme"));
      window.dispatchEvent(new Event("nearby-tod"));
    }
  };
  if (opts?.fade && changed) {
    root.classList.add("tod-fade");
    window.setTimeout(() => {
      apply();
      window.setTimeout(() => root.classList.remove("tod-fade"), 900);
    }, 700);
    return true;
  }
  apply();
  return changed;
}

export function readGreeting(): string {
  if (typeof document === "undefined") return "Good night";
  return document.documentElement.dataset.greeting || greetingFor(currentPeriod());
}

export const TOD_EVENT = "nearby-tod";

/** Runs in <head> before first paint. Keep in sync with paintTheme / syncBrowserChrome. */
export const themeBoot = `(function(){
function hour(){try{var parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kathmandu",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date());for(var i=0;i<parts.length;i++){if(parts[i].type==="hour")return parseInt(parts[i].value,10)}}catch(e){}return new Date().getHours()}
function period(h){if(h>=5&&h<11)return"morning";if(h>=11&&h<16)return"afternoon";if(h>=16&&h<19)return"evening";return"night"}
function greet(p){return p==="morning"?"Good morning":p==="afternoon"?"Good afternoon":p==="evening"?"Good evening":"Good night"}
function choice(){try{var stored=localStorage.getItem("nearby-theme-choice");if(stored==="light"||stored==="dark")return stored;if(stored==="auto"||stored==="system")return"system"}catch(e){}return"system"}
function apply(nextChoice){
  var theme=nextChoice==="light"||nextChoice==="dark"?nextChoice:(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");
  var root=document.documentElement;
  var p=period(hour());
  root.dataset.theme=theme;
  root.dataset.themeChoice=nextChoice;
  root.dataset.tod=p;
  root.dataset.atmosphere="plain";
  root.dataset.greeting=greet(p);
  root.dataset.todLock="";
  root.style.colorScheme=theme;
  var explicit=nextChoice==="light"||nextChoice==="dark";
  var scheme=document.querySelector('meta[name="color-scheme"]');
  if(!scheme){scheme=document.createElement("meta");scheme.setAttribute("name","color-scheme");document.head.appendChild(scheme)}
  scheme.setAttribute("content",explicit?theme:"light dark");
  var override=document.querySelector('meta[name="theme-color"][data-theme-override]');
  if(explicit){
    if(!override){override=document.createElement("meta");override.setAttribute("name","theme-color");override.setAttribute("data-theme-override","1");document.head.appendChild(override)}
    override.setAttribute("content",theme==="light"?"#ffffff":"#0a0a0a");
    override.removeAttribute("media");
  }else if(override){override.remove()}
}
try{
  apply(choice());
  var media=matchMedia("(prefers-color-scheme: light)");
  if(media.addEventListener)media.addEventListener("change",function(){var current=document.documentElement.dataset.themeChoice||"system";if(current==="system"||current==="auto")apply("system")});
}catch(e){document.documentElement.dataset.theme="dark";document.documentElement.dataset.atmosphere="plain"}
})();`;
