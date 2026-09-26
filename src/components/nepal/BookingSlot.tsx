import { stationCommerce } from "@/lib/nepal/commerce";

export function BookingSlot({
  fee,
  payment,
}: {
  fee: string | null;
  payment: string | null;
}) {
  const comingSoon =
    stationCommerce.booking === "coming_soon" ||
    stationCommerce.payment === "coming_soon";

  return (
    <section className="space-y-3" aria-label="Payment and booking">
      {fee ? (
        <p className="text-sm text-[var(--ink-muted)]">
          Listed fee: {fee}
        </p>
      ) : null}
      {payment ? (
        <p className="text-sm text-[var(--ink-muted)]">
          Listed payment: {payment}
        </p>
      ) : null}
      {comingSoon ? (
        <div className="sketch-card px-4 py-3">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink-faint)]"
          >
            Book or pay · coming soon
          </button>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            Paying or reserving a charger inside Nearby is not available yet.
            Call the station if you need to confirm access.
          </p>
        </div>
      ) : null}
    </section>
  );
}
