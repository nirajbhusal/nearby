import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingSlot } from "@/components/nepal/BookingSlot";
import { NavigateLinks } from "@/components/nepal/NavigateLinks";
import { LogoMark } from "@/components/brand/Logo";
import { pageMeta } from "@/lib/site";
import {
  accessCopy,
  formatUpdated,
  phoneHref,
  sourceLabel,
  speedLabel,
  stationCaution,
} from "@/lib/nepal/format";
import { allStationIds, getStation } from "@/lib/nepal/stations";

export const dynamicParams = false;

export function generateStaticParams() {
  return allStationIds().map((id) => ({ id }));
}

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const station = getStation(id);
  if (!station) return { title: "Charging station — Nearby" };
  const place = [station.city, station.district].filter(Boolean).join(", ");
  const description = place
    ? `${station.name} in ${place}. Curated charging-station details for Nepal.`
    : `${station.name}. Curated charging-station details for Nepal.`;
  return pageMeta(`${station.name} — EV charging — Nearby`, description, `/ev/${station.id}`);
}

function formatKw(kw: number | null): string | null {
  if (kw == null) return null;
  return Number.isInteger(kw) ? `${kw} kW` : `${kw} kW`;
}

export default async function StationPage({ params }: { params: Params }) {
  const { id } = await params;
  const station = getStation(id);
  if (!station) notFound();

  const access = accessCopy(station.access);
  const caution = stationCaution(station.name, station.notes);
  const call = phoneHref(station.phone);
  const backCity = `/charge?station=${encodeURIComponent(station.id)}${
    station.city ? `&q=${encodeURIComponent(station.city)}` : ""
  }`;
  const updated = formatUpdated(station.last_verified);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href={backCity}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--ink-faint)] transition hover:text-[var(--graphite)]"
      >
        <LogoMark className="h-3.5 w-3.5 text-[var(--accent)]" />
        Open on the map
      </Link>

      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm tracking-wide text-[var(--accent)]">
            {speedLabel(station.speed)}
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {station.name}
          </h1>
          <p className="text-lg leading-relaxed text-[var(--ink-muted)]">
            {[station.network, station.operator].filter(Boolean).join(" · ") ||
              "Operator not listed"}
          </p>
        </div>

        <NavigateLinks lat={station.lat} lng={station.lng} />

        <dl className="space-y-4 text-[15px]">
          <div>
            <dt className="text-xs tracking-wide text-[var(--ink-faint)]">Address</dt>
            <dd className="mt-1 text-[var(--graphite)]">
              {station.address || "Address not listed"}
              {station.city ? (
                <span className="block text-[var(--ink-muted)]">
                  {[station.city, station.district, station.province]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-[var(--ink-faint)]">
              Connectors
            </dt>
            <dd className="mt-1">
              {station.connectors.length === 0 ? (
                <p>Connectors not listed</p>
              ) : (
                <ul className="space-y-1">
                  {station.connectors.map((connector, index) => (
                    <li key={`${connector.type}-${index}`}>
                      {connector.type}
                      {formatKw(connector.power_kw)
                        ? ` · ${formatKw(connector.power_kw)}`
                        : ""}
                      {connector.count != null
                        ? ` · ${connector.count} plug${connector.count === 1 ? "" : "s"}`
                        : ""}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-[var(--ink-faint)]">Hours</dt>
            <dd className="mt-1">{station.open_hours || "Hours not listed"}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-[var(--ink-faint)]">Phone</dt>
            <dd className="mt-1">
              {call ? (
                <a href={call} className="ink-link">
                  {station.phone}
                </a>
              ) : (
                "Phone not listed"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-[var(--ink-faint)]">Access</dt>
            <dd className="mt-1">
              <p className="font-medium text-[var(--graphite)]">{access.short}</p>
              <p className="mt-1 leading-relaxed text-[var(--ink-muted)]">
                {access.long}
              </p>
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-[var(--ink-faint)]">
              Location
            </dt>
            <dd className="mt-1 text-[var(--ink-muted)]">
              {station.geo_precision === "exact"
                ? "Coordinates come from a published source."
                : "Location is approximate."}{" "}
              {station.lat.toFixed(5)}, {station.lng.toFixed(5)}
            </dd>
          </div>
        </dl>

        {caution ? (
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{caution}</p>
        ) : null}

        <BookingSlot fee={station.fee} payment={station.payment} />

        <div className="space-y-2">
          <p className="text-xs tracking-wide text-[var(--ink-faint)]">
            Curated · last updated {updated}
          </p>
          <ul className="space-y-1 text-sm">
            {station.sources.map((source) => (
              <li key={source.url + source.name}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ink-link"
                >
                  {sourceLabel(source.name)}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            Compiled from public directories. This is not a field visit, and a
            listing here does not mean the charger is open to everyone.
          </p>
        </div>
      </div>
    </main>
  );
}
