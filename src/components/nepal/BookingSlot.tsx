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
    <section className="space-y-2" aria-label="Payment and booking">
      {fee ? <p className="text-sm text-[var(--ink-muted)]">Listed fee: {fee}</p> : null}
      {payment ? (
        <p className="text-sm text-[var(--ink-muted)]">Listed payment: {payment}</p>
      ) : null}
      {comingSoon ? <p className="coming-soon">Booking and payment — coming soon</p> : null}
    </section>
  );
}
