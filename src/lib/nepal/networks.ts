import networksJson from "@/data/nepal/ev-networks.json";

export type EvNetworkApps = {
  android: string | null;
  ios: string | null;
};

export type EvNetwork = {
  id: string;
  name: string;
  short: string;
  full_name: string;
  website: string | null;
  apps: EvNetworkApps;
  station_count: number;
  aliases: string[];
  sources: { name: string; url: string }[];
};

type NetworksFile = {
  unbranded_count: number;
  networks: EvNetwork[];
};

const file = networksJson as NetworksFile;

export const evNetworks: EvNetwork[] = file.networks;
export const unbrandedCount = file.unbranded_count;

const byId = new Map(evNetworks.map((network) => [network.id, network]));

/** Niraj named these four first. The rest of the quick row follows station count. */
const LEAD_IDS = ["gadicharge", "nea", "maw-vriddhi", "cg-motors"] as const;

const FEATURED_IDS = [
  "tata-sipradi",
  "electriva",
  "mg",
  "byd",
  "hyundai",
  "thee-go",
  "aircharge",
] as const;

/** Neutral marks. Logos are not hotlinked. */
const MONOGRAMS: Record<string, string> = {
  gadicharge: "GC",
  nea: "NEA",
  "maw-vriddhi": "MAW",
  "cg-motors": "CG",
  "tata-sipradi": "TATA",
  electriva: "EV",
  mg: "MG",
  byd: "BYD",
  hyundai: "HYU",
  "thee-go": "TG",
  aircharge: "AIR",
  "yatri-energy": "YAT",
  kia: "KIA",
  dfsk: "DFSK",
  gwm: "GWM",
  "plug-n-sip": "PNS",
};

export function networkById(id: string | null | undefined): EvNetwork | null {
  if (!id) return null;
  return byId.get(id) ?? null;
}

export function canonicalNetworkId(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (!key) return null;
  if (key === "unbranded") return "unbranded";
  if (byId.has(key)) return key;
  for (const network of evNetworks) {
    if (network.name.toLowerCase() === key) return network.id;
    if (network.short.toLowerCase() === key) return network.id;
    if (network.aliases.some((alias) => alias.toLowerCase() === key)) return network.id;
  }
  return null;
}

export function networkMonogram(network: string | null | undefined): string | null {
  if (!network) return null;
  if (MONOGRAMS[network]) return MONOGRAMS[network];
  const id = canonicalNetworkId(network);
  if (id && MONOGRAMS[id]) return MONOGRAMS[id];
  return null;
}

/** Chip text. Tata and theeGO use the short name; the others use the canonical name. */
export function networkChipLabel(id: string): string {
  if (id === "unbranded") return "Unbranded";
  const network = byId.get(id);
  if (!network) return id;
  if (id === "tata-sipradi" || id === "thee-go") return network.short;
  return network.name;
}

export type NetworkChip = {
  id: string;
  label: string;
  count: number;
};

function chip(id: string, counts: Map<string, number>): NetworkChip {
  return { id, label: networkChipLabel(id), count: counts.get(id) ?? 0 };
}

function byCount(a: NetworkChip, b: NetworkChip): number {
  return b.count - a.count || a.label.localeCompare(b.label);
}

export function networkChipRows(counts: Map<string, number>): {
  primary: NetworkChip[];
  more: NetworkChip[];
} {
  const primary = [
    ...LEAD_IDS.map((id) => chip(id, counts)),
    ...FEATURED_IDS.map((id) => chip(id, counts)).sort(byCount),
  ];
  const shown = new Set<string>([...LEAD_IDS, ...FEATURED_IDS]);
  const more = [
    ...evNetworks.filter((network) => !shown.has(network.id)).map((network) => chip(network.id, counts)),
    chip("unbranded", counts),
  ].sort(byCount);
  return { primary, more };
}

const NETWORK_ORDER = [
  ...LEAD_IDS,
  ...FEATURED_IDS,
  ...evNetworks.map((network) => network.id).filter((id) => !LEAD_IDS.includes(id as (typeof LEAD_IDS)[number]) && !FEATURED_IDS.includes(id as (typeof FEATURED_IDS)[number])),
  "unbranded",
];

/** Stable param order: the four named networks, then the featured row, then the rest. */
export function orderNetworkIds(ids: string[]): string[] {
  const rank = new Map(NETWORK_ORDER.map((id, index) => [id, index]));
  return [...new Set(ids)].sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99) || a.localeCompare(b));
}

export function isApproximatePlace(precision: string | null | undefined): boolean {
  return precision != null && precision !== "exact";
}

/** Place search for town-centre pins. Exact stations keep coordinate directions. */
export function directionQuery(station: {
  name: string;
  city: string | null;
  district: string | null;
}): string {
  const town = station.city || station.district || "";
  return [station.name, town].filter(Boolean).join(" ");
}
