import { THEME_KEY, type ThemeChoice } from "@/lib/local-profile";

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

function computePaint(choice: ThemeChoice, ignoreQuery: boolean): Paint {
  const query = ignoreQuery ? null : readTodQuery();
  const period = query ?? currentPeriod();
  const greeting = greetingFor(period);
  if (query) {
    return { period, theme: themeForPeriod(period), atmosphere: period, greeting };
  }
  if (choice === "light" || choice === "dark") {
    return { period, theme: choice, atmosphere: "plain", greeting };
  }
  if (choice === "system") {
    const light =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches;
    return { period, theme: light ? "light" : "dark", atmosphere: "plain", greeting };
  }
  return { period, theme: themeForPeriod(period), atmosphere: period, greeting };
}

/** Apply the theme and time-of-day atmosphere. Returns true when the look changed. */
export function paintTheme(choice: ThemeChoice, opts?: { ignoreQuery?: boolean; fade?: boolean }): boolean {
  if (typeof document === "undefined") return false;
  const next = computePaint(choice, opts?.ignoreQuery === true);
  const root = document.documentElement;
  const changed =
    root.dataset.theme !== next.theme ||
    root.dataset.atmosphere !== next.atmosphere ||
    root.dataset.tod !== next.period ||
    root.dataset.greeting !== next.greeting;
  const apply = () => {
    root.dataset.theme = next.theme;
    root.dataset.themeChoice = choice;
    root.dataset.atmosphere = next.atmosphere;
    root.dataset.tod = next.period;
    root.dataset.greeting = next.greeting;
    if (opts?.ignoreQuery) root.dataset.todLock = "";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next.theme === "light" ? "#F5F5F7" : "#000000");
    try {
      localStorage.setItem(THEME_KEY, next.theme);
    } catch {
      /* private mode */
    }
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

/** Runs in <head> before first paint. Keep in sync with paintTheme. */
export const themeBoot = `(function(){function hour(){try{var parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kathmandu",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date());for(var i=0;i<parts.length;i++){if(parts[i].type==="hour")return parseInt(parts[i].value,10)}}catch(e){}return new Date().getHours()}function period(h){if(h>=5&&h<11)return"morning";if(h>=11&&h<16)return"afternoon";if(h>=16&&h<19)return"evening";return"night"}function greet(p){return p==="morning"?"Good morning":p==="afternoon"?"Good afternoon":p==="evening"?"Good evening":"Good night"}function light(p){return p==="morning"||p==="afternoon"}try{var q=new URLSearchParams(location.search).get("tod");var forced=q==="morning"||q==="afternoon"||q==="evening"||q==="night";var p=forced?q:period(hour());var choice="auto";try{var stored=localStorage.getItem("nearby-theme-choice");var legacy=localStorage.getItem("nearby-theme");if(stored==="auto"||stored==="system"||stored==="light"||stored==="dark")choice=stored;else if(legacy==="light"||legacy==="dark")choice=legacy}catch(e){}var theme="dark";var atmosphere="plain";if(forced){theme=light(p)?"light":"dark";atmosphere=p}else if(choice==="light"||choice==="dark"){theme=choice}else if(choice==="system"){theme=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}else{theme=light(p)?"light":"dark";atmosphere=p}var root=document.documentElement;root.dataset.theme=theme;root.dataset.themeChoice=choice;root.dataset.tod=p;root.dataset.atmosphere=atmosphere;root.dataset.greeting=greet(p);root.dataset.todLock=forced?"1":"";var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",theme==="light"?"#F5F5F7":"#000000");var paint=function(){var el=document.getElementById("nearby-greet");if(!el||el.getAttribute("data-filled")==="1")return;var name="";try{var raw=localStorage.getItem("nearby-profile");var profile=raw?JSON.parse(raw):null;if(profile&&typeof profile.name==="string")name=profile.name.trim()}catch(e){}el.textContent=name?root.dataset.greeting+", "+name:root.dataset.greeting;el.setAttribute("data-filled","1")};if(document.getElementById("nearby-greet"))paint();else{var obs=new MutationObserver(function(){if(document.getElementById("nearby-greet")){paint();obs.disconnect()}});obs.observe(document.documentElement,{childList:true,subtree:true})}}catch(e){document.documentElement.dataset.theme="dark";document.documentElement.dataset.atmosphere="night";document.documentElement.dataset.tod="night";document.documentElement.dataset.greeting="Good night"}})();`;
