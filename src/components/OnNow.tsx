import { toHref } from "@/components/SiteLink";
import { eventHref } from "@/lib/item-link";
import { eventsOnNow } from "@/lib/nepal/events";

export function OnNow() {
  const live = eventsOnNow(new Date());
  if (live.length === 0) return null;
  return (
    <footer className="site-now">
      <p>
        <span className="site-now-label">On now:</span>{" "}
        {live.map((event, index) => (
          <span key={event.id}>
            {index > 0 ? <span className="site-now-dot"> · </span> : null}
            <a href={toHref(eventHref(event.id))}>{event.title}</a>
          </span>
        ))}
      </p>
    </footer>
  );
}
