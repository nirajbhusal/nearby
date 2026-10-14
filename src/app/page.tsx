import { AskNearby, PromptCard } from "@/components/home/AskNearby";
import { HomePeek } from "@/components/peek/Peek";
import { DayGreeting } from "@/components/home/DayGreeting";
import { NepalClock } from "@/components/home/NepalClock";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta(
  "Nearby · All within reach",
  "Chargers, tech jobs, events and places to learn in Nepal.",
  "/",
);

export default function HomePage() {
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
      </section>
    </main>
  );
}
