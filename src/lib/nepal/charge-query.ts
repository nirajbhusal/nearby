import { PLUG_FILTERS, type PlugFilter } from "@/lib/nepal/ev";

export type ChargeState = {
  q: string;
  lat: number | null;
  lng: number | null;
  station: string | null;
  fast: boolean;
  plugs: PlugFilter[];
  network: string | null;
  /** Used only when `radiusSet` is true. Null means the whole scope. */
  radius: number | null;
  radiusSet: boolean;
  near: boolean;
};

type SearchReader = {
  get(name: string): string | null;
};

export function readChargeState(sp: SearchReader): ChargeState {
  const plugs = PLUG_FILTERS.map((item) => item.id).filter((id) => sp.get(id) === "1");
  const latRaw = sp.get("lat");
  const lngRaw = sp.get("lng");
  const lat = latRaw == null || latRaw === "" ? Number.NaN : Number(latRaw);
  const lng = lngRaw == null || lngRaw === "" ? Number.NaN : Number(lngRaw);
  const radiusRaw = sp.get("r");
  const radiusSet = radiusRaw != null;
  let radius: number | null = 25;
  if (radiusRaw === "all") radius = null;
  else if (radiusRaw != null && Number.isFinite(Number(radiusRaw))) radius = Number(radiusRaw);

  return {
    // `place` and `q` both name the search. `place` wins when a shared link uses it.
    q: (sp.get("place") || sp.get("q") || "").trim(),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    station: sp.get("station"),
    fast: sp.get("fast") === "1",
    plugs,
    network: sp.get("net"),
    radius,
    radiusSet,
    near: sp.get("near") === "1",
  };
}

export function writeChargeSearch(state: ChargeState): string {
  const sp = new URLSearchParams();
  if (state.q) sp.set("q", state.q);
  if (state.lat != null && state.lng != null) {
    sp.set("lat", state.lat.toFixed(5));
    sp.set("lng", state.lng.toFixed(5));
  }
  if (state.station) sp.set("station", state.station);
  if (state.fast) sp.set("fast", "1");
  for (const plug of PLUG_FILTERS) {
    if (state.plugs.includes(plug.id)) sp.set(plug.id, "1");
  }
  if (state.network) sp.set("net", state.network);
  if (state.radiusSet) sp.set("r", state.radius == null ? "all" : String(state.radius));
  if (state.near) sp.set("near", "1");
  const query = sp.toString();
  return query ? `?${query}` : "";
}
