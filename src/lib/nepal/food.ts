import placesJson from "@/data/nepal/cafes-food.json";
import { haversineKm } from "@/lib/geo";

export type FoodCategory = "coffee" | "food" | "local" | "thakali";
export type FoodCityId = "kathmandu" | "pokhara";
export type FoodFilter = "all" | FoodCategory;

export type FoodPlace = {
  id: string;
  name: string;
  category: FoodCategory[];
  city: string;
  town: string | null;
  area: string | null;
  lat: number;
  lng: number;
  opening_hours: string | null;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  google_maps_url: string;
  osm_url: string | null;
  rating: number | null;
  rating_source: string | null;
  rating_date: string | null;
  description: string | null;
  known_for: string | null;
};

export type FoodSpot = FoodPlace & { distanceKm: number };

export const FOOD_CITIES: { id: FoodCityId; label: string; lat: number; lng: number; dataCity: string }[] = [
  { id: "kathmandu", label: "Kathmandu", lat: 27.7061, lng: 85.3148, dataCity: "Kathmandu Valley" },
  { id: "pokhara", label: "Pokhara", lat: 28.2096, lng: 83.9556, dataCity: "Pokhara" },
];

export const FOOD_FILTERS: { id: FoodFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "coffee", label: "Coffee" },
  { id: "food", label: "Food" },
  { id: "local", label: "Local food" },
  { id: "thakali", label: "Thakali" },
];

const CATEGORY_LABEL: Record<FoodCategory, string> = {
  coffee: "Coffee",
  food: "Food",
  local: "Local food",
  thakali: "Thakali",
};

const CATEGORY_ORDER: FoodCategory[] = ["coffee", "food", "local", "thakali"];

function asCategories(value: unknown): FoodCategory[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is FoodCategory => CATEGORY_ORDER.includes(item as FoodCategory));
}

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text === "—" || text === "–" || text === "-") return null;
  return text;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export const foodPlaces: FoodPlace[] = (placesJson as unknown[]).map((row) => {
  const item = row as Record<string, unknown>;
  return {
    id: String(item.id),
    name: String(item.name),
    category: asCategories(item.category),
    city: String(item.city),
    town: asText(item.town),
    area: asText(item.area),
    lat: Number(item.lat),
    lng: Number(item.lng),
    opening_hours: asText(item.opening_hours),
    website: asText(item.website),
    instagram: asText(item.instagram),
    phone: asText(item.phone),
    google_maps_url: String(item.google_maps_url),
    osm_url: asText(item.osm_url),
    rating: asNumber(item.rating),
    rating_source: asText(item.rating_source),
    rating_date: asText(item.rating_date),
    description: asText(item.description),
    known_for: asText(item.known_for),
  };
});

export function foodCity(id: FoodCityId) {
  return FOOD_CITIES.find((city) => city.id === id) ?? FOOD_CITIES[0];
}

export function cityForPlace(place: FoodPlace): FoodCityId {
  return place.city === "Pokhara" ? "pokhara" : "kathmandu";
}

export function categoryLabels(place: FoodPlace): string[] {
  return CATEGORY_ORDER.filter((id) => place.category.includes(id)).map((id) => CATEGORY_LABEL[id]);
}

export function placeMatches(place: FoodPlace, filter: FoodFilter): boolean {
  if (filter === "all") return true;
  return place.category.includes(filter);
}

export function spotsInCity(cityId: FoodCityId, origin: { lat: number; lng: number }, filter: FoodFilter): FoodSpot[] {
  const city = foodCity(cityId);
  return foodPlaces
    .filter((place) => place.city === city.dataCity && placeMatches(place, filter))
    .map((place) => ({
      ...place,
      distanceKm: haversineKm(origin.lat, origin.lng, place.lat, place.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm || a.name.localeCompare(b.name));
}

export function nearestFoodCity(lat: number, lng: number): FoodCityId {
  let best: FoodCityId = "kathmandu";
  let bestKm = Infinity;
  for (const city of FOOD_CITIES) {
    const km = haversineKm(lat, lng, city.lat, city.lng);
    if (km < bestKm) {
      bestKm = km;
      best = city.id;
    }
  }
  return best;
}

export function foodBBox(spots: FoodSpot[], pad = 0.012): [number, number, number, number] | null {
  if (!spots.length) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const spot of spots) {
    west = Math.min(west, spot.lng);
    east = Math.max(east, spot.lng);
    south = Math.min(south, spot.lat);
    north = Math.max(north, spot.lat);
  }
  return [west - pad, south - pad, east + pad, north + pad];
}

export function siteLabel(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

export function instagramHref(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://instagram.com/${value.replace(/^@/, "")}`;
}
