import { appleMapsDir, googleMapsDir } from "@/lib/nepal/format";

export function NavigateLinks({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={googleMapsDir(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-full bg-[var(--graphite)] px-4 py-2 text-sm font-medium text-[var(--paper)] transition hover:bg-[var(--accent)]"
      >
        Navigate
      </a>
      <a
        href={appleMapsDir(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="ink-link px-1 py-2 text-sm"
      >
        Apple Maps
      </a>
    </div>
  );
}
