import { BookOpen, Briefcase, Calendar, Compass, Zap } from "lucide-react";
import { HomePeek } from "@/components/peek/Peek";
import { DayGreeting } from "@/components/home/DayGreeting";
import { NepalClock } from "@/components/home/NepalClock";
import { toHref } from "@/components/SiteLink";
import { evIndex } from "@/lib/nepal/ev";
import { eventTiming, nepalEvents } from "@/lib/nepal/events";
import { formatWhen } from "@/lib/nepal/format";
import { companiesNear, jobRoleCards } from "@/lib/nepal/jobs";
import { learnPlaces } from "@/lib/nepal/learn";
import { nomadCities } from "@/lib/nepal/nomad";
import { NEPAL } from "@/lib/nepal/places";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Nearby · All within reach",
  "Chargers, tech jobs, events and places to learn in Nepal.",
  "/",
);

function nextUp(): { href: string; text: string } | null {
  const now = new Date();
  const upcoming = nepalEvents
    .filter((event) => event.start_date && eventTiming(event, now) === "upcoming")
    .sort((a, b) => new Date(a.start_date ?? 0).getTime() - new Date(b.start_date ?? 0).getTime());
  const live = upcoming.filter((event) => new Date(event.start_date ?? 0).getTime() <= now.getTime());
  const next = live.length
    ? live.slice().sort((a, b) => {
        const aEnd = new Date(a.end_date || a.start_date || 0).getTime();
        const bEnd = new Date(b.end_date || b.start_date || 0).getTime();
        return aEnd - bEnd;
      })[0]
    : upcoming[0];
  if (!next?.start_date) return null;
  const title = next.title.length > 56 ? `${next.title.slice(0, 53)}…` : next.title;
  const label = live.length ? "On now" : "Next up";
  return {
    href: toHref(`/events?id=${encodeURIComponent(next.id)}`),
    text: `${label} · ${title} · ${formatWhen(next.start_date, next.end_date)}`,
  };
}

function noun(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

export default function HomePage() {
  const now = new Date();
  const upcoming = nextUp();
  const chargers = evIndex.length;
  const roles = jobRoleCards(
    companiesNear(NEPAL, { category: null, city: null, remoteOnly: false, nationwide: true }).near,
  ).length;
  const events = nepalEvents.filter((event) => eventTiming(event, now) !== "past").length;
  const learn = learnPlaces.length;
  const cities = nomadCities.length;
  const sections = [
    { href: "/charge", name: "Charge", count: chargers, meta: noun(chargers, "charger", "chargers"), icon: Zap },
    { href: "/jobs", name: "Jobs", count: roles, meta: noun(roles, "open role", "open roles"), icon: Briefcase },
    { href: "/events", name: "Events", count: events, meta: noun(events, "coming up", "coming up"), icon: Calendar },
    { href: "/learn", name: "Learn", count: learn, meta: noun(learn, "place", "places"), icon: BookOpen },
    { href: "/nomad", name: "Nomad", count: cities, meta: noun(cities, "city", "cities"), icon: Compass },
  ];
  return (
    <main className="home">
      <section className="start-screen">
        <div className="home-hero">
          <HomePeek />
          <div className="reveal-greet">
            <DayGreeting />
            <NepalClock />
          </div>
          <h1 className="font-display hero-title">Everything near you, in one place.</h1>
        </div>
        <div className="home-sections">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <a key={section.href} className="home-section" href={toHref(section.href)}>
                <Icon size={22} strokeWidth={1.5} aria-hidden />
                <span className="home-section-name">{section.name}</span>
                <strong className="tabular">{section.count}</strong>
                <small>{section.meta}</small>
              </a>
            );
          })}
        </div>
        {upcoming ? (
          <p className="home-next">
            <a href={upcoming.href}>{upcoming.text}</a>
          </p>
        ) : null}
      </section>
    </main>
  );
}
