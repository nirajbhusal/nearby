import { AskNearby, PromptCard } from "@/components/home/AskNearby";
import { HomePeek } from "@/components/peek/Peek";
import { DayGreeting } from "@/components/home/DayGreeting";
import { NepalClock } from "@/components/home/NepalClock";
import { toHref } from "@/components/SiteLink";
import { eventTiming, nepalEvents } from "@/lib/nepal/events";
import { formatWhen } from "@/lib/nepal/format";
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

export default function HomePage() {
  const upcoming = nextUp();
  return (
    <main className="home">
      <section className="start-screen">
        <HomePeek />
        <div className="reveal-greet">
          <NepalClock />
          <DayGreeting />
        </div>
        <h1 className="font-display hero-title">Everything near you, in one place.</h1>
        <AskNearby />
        <div className="prompt-grid">
          <PromptCard href="/charge?near=1&fast=1" title="Fast chargers near me" scene="charge" />
          <PromptCard href="/jobs?q=Kathmandu&category=ai-data" title="AI jobs in Kathmandu" scene="jobs" />
          <PromptCard href="/events?q=Kathmandu&when=week" title="Events this week" scene="events" />
          <PromptCard href="/nomad/pokhara" title="Coworking in Pokhara" scene="pokhara" />
          <PromptCard href="/learn?q=Kathmandu" title="Learn AI nearby" scene="learn" />
          <PromptCard href="/nomad/kathmandu" title="Stays in Kathmandu" scene="kathmandu" />
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
