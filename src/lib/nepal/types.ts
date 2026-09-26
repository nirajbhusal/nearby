export type SourceLink = {
  name: string;
  url: string;
};

export type EvPlug = {
  type: string;
  kw: number | null;
  n: number;
};

/** Slim station used by the list and map. Full records stay on detail pages. */
export type EvIndexStation = {
  id: string;
  name: string;
  operator: string | null;
  network: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  province: string | null;
  lat: number;
  lng: number;
  speed: string;
  access: string;
  phone: string | null;
  plugs: EvPlug[];
  caution: string | null;
};

export type EvConnector = {
  type: string;
  power_kw: number | null;
  count: number | null;
};

export type EvStation = {
  id: string;
  name: string;
  operator: string | null;
  network: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  province: string | null;
  lat: number;
  lng: number;
  geo_precision: string | null;
  connectors: EvConnector[];
  speed: string;
  open_hours: string | null;
  fee: string | null;
  payment: string | null;
  phone: string | null;
  access: string;
  sources: SourceLink[];
  last_verified: string;
  notes: string | null;
};

export type CompanyOffice = {
  city: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  geo_precision: string | null;
};

export type OpenRole = {
  title: string;
  location: string | null;
  url: string;
  source: string;
  seen_date: string;
};

export type NepalCompany = {
  slug: string;
  name: string;
  website: string | null;
  careers_url: string | null;
  category: string;
  description: string | null;
  hq_city: string | null;
  global_hq: string | null;
  offices: CompanyOffice[];
  remote_friendly: boolean | null;
  open_roles: OpenRole[];
  sources: SourceLink[];
  source_label: string;
  last_verified: string;
};

export type LearnProgram = {
  title: string;
  level: string | null;
  duration: string | null;
  cost: string | null;
  url: string;
};

export type LearnPlace = {
  slug: string;
  name: string;
  type: string;
  programs: LearnProgram[];
  city: string | null;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  geo_precision: string | null;
  website: string | null;
  contact: string | null;
  mode: string | null;
  sources: SourceLink[];
  last_verified: string;
};

export type NepalEvent = {
  id: string;
  title: string;
  organizer: string | null;
  type: string;
  topics: string[];
  start_date: string | null;
  end_date: string | null;
  recurring: string | null;
  city: string | null;
  venue: string | null;
  lat: number | null;
  lng: number | null;
  geo_precision: string | null;
  url: string | null;
  free: boolean | null;
  status: string;
  sources: SourceLink[];
  last_verified: string;
};

export type PlaceKind = "city" | "district" | "province" | "area" | "geolocation";

export type PlaceHit = {
  label: string;
  lat: number;
  lng: number;
  kind: PlaceKind;
  city: string | null;
  district: string | null;
  province: string | null;
};

/**
 * In-app commerce is intentionally not wired up.
 * Flip a field to "available" when a real flow exists.
 */
export type CommerceCapability = "coming_soon" | "available";

export type StationCommerce = {
  booking: CommerceCapability;
  payment: CommerceCapability;
};
