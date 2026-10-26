import type { FoodCityId, FoodFilter } from "@/lib/nepal/food";

export type FoodView = "map" | "list";
export type FoodScope = "nearby" | "all";
export type FoodSheet = "peek" | "half" | "full";

export type FoodState = {
  city: FoodCityId;
  filter: FoodFilter;
  id: string | null;
  view: FoodView;
  scope: FoodScope;
  lat: number | null;
  lng: number | null;
  near: boolean;
  sheet: FoodSheet | null;
};

type SearchReader = { get(name: string): string | null };

const FILTERS: FoodFilter[] = ["all", "coffee", "food", "local", "thakali"];

function readFilter(value: string | null): FoodFilter {
  if (value && FILTERS.includes(value as FoodFilter)) return value as FoodFilter;
  return "all";
}

function readSheet(value: string | null): FoodSheet | null {
  if (value === "peek" || value === "half" || value === "full") return value;
  return null;
}

function readCoord(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function readFoodState(sp: SearchReader): FoodState {
  return {
    city: sp.get("city") === "pokhara" ? "pokhara" : "kathmandu",
    filter: readFilter(sp.get("cat")),
    id: sp.get("id"),
    view: sp.get("view") === "list" ? "list" : "map",
    scope: sp.get("scope") === "all" ? "all" : "nearby",
    lat: readCoord(sp.get("lat")),
    lng: readCoord(sp.get("lng")),
    near: sp.get("near") === "1",
    sheet: readSheet(sp.get("sheet")),
  };
}

export function writeFoodSearch(state: FoodState): string {
  const sp = new URLSearchParams();
  if (state.city === "pokhara") sp.set("city", "pokhara");
  if (state.filter !== "all") sp.set("cat", state.filter);
  if (state.id) sp.set("id", state.id);
  if (state.view === "list") sp.set("view", "list");
  if (state.scope === "all") sp.set("scope", "all");
  if (state.lat != null && state.lng != null) {
    sp.set("lat", state.lat.toFixed(5));
    sp.set("lng", state.lng.toFixed(5));
  }
  if (state.near) sp.set("near", "1");
  if (state.sheet) sp.set("sheet", state.sheet);
  const query = sp.toString();
  return query ? `?${query}` : "";
}
