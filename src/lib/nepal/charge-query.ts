import { PLUG_FILTERS, type PlugFilter } from "@/lib/nepal/ev";
import { canonicalNetworkId, orderNetworkIds } from "@/lib/nepal/networks";

export type ChargeState = {
  q: string;
  lat: number | null;
  lng: number | null;
  station: string | null;
  fast: boolean;
  plugs: PlugFilter[];
  networks: string[];
  exact: boolean;
  /** Used only when `radiusSet` is true. Null means the whole scope. */
  radius: number | null;
  radiusSet: boolean;
  near: boolean;
  view: "map" | "list";
  /** Province slug. Used when the map is scoped to a province rather than a search. */
  province: string | null;
  /** Bottom sheet height. Null uses the default for the current mode. */
  sheet: "peek" | "half" | "full" | null;
};

type SearchReader = {
  get(name: string): string | null;
};

function readNetworks(sp: SearchReader): string[] {
  const raw = sp.get("network") || "";
  const fromParam = raw
    .split(",")
    .map((part) => canonicalNetworkId(part))
    .filter((id): id is string => Boolean(id));
  if (fromParam.length) return orderNetworkIds(fromParam);
  const legacy = canonicalNetworkId(sp.get("net"));
  return legacy ? [legacy] : [];
}

function readSheet(value: string | null): ChargeState["sheet"] {
  if (value === "peek" || value === "half" || value === "full") return value;
  return null;
}

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
    station: sp.get("station") || sp.get("id"),
    fast: sp.get("fast") === "1",
    plugs,
    networks: readNetworks(sp),
    exact: sp.get("exact") === "1",
    radius,
    radiusSet,
    near: sp.get("near") === "1",
    view: sp.get("view") === "list" || sp.get("view") === "cards" ? "list" : "map",
    province: (sp.get("province") || "").trim().toLowerCase() || null,
    sheet: readSheet(sp.get("sheet")),
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
  if (state.networks.length) sp.set("network", orderNetworkIds(state.networks).join(","));
  if (state.exact) sp.set("exact", "1");
  if (state.radiusSet) sp.set("r", state.radius == null ? "all" : String(state.radius));
  if (state.near) sp.set("near", "1");
  if (state.view === "list") sp.set("view", "list");
  if (state.province && !state.q && state.lat == null) sp.set("province", state.province);
  if (state.sheet) sp.set("sheet", state.sheet);
  const query = sp
    .toString()
    .replace(/(^|&)network=([^&]*)/g, (_, prefix: string, value: string) => `${prefix}network=${value.replace(/%2C/gi, ",")}`);
  return query ? `?${query}` : "";
}
