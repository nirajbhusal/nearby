"use client";

import { useSyncExternalStore } from "react";
import { paintTheme } from "@/lib/tod";
import {
  EMPTY_PROFILE,
  PROFILE_KEY,
  SAVED_KEY,
  THEME_CHOICE_KEY,
  THEME_KEY,
  UNITS_KEY,
  LOCAL_DATA_KEYS,
  parseProfile,
  parseSaved,
  readThemeChoice,
  type DistanceUnit,
  type Profile,
  type SavedRecord,
  type ThemeChoice,
} from "@/lib/local-profile";

const PROFILE_EVENT = "nearby-profile";
const SAVED_EVENT = "nearby-saved";
const UNITS_EVENT = "nearby-units";
const THEME_EVENT = "nearby-theme";

let profileCache = EMPTY_PROFILE;
let profileRaw: string | null = null;
let savedCache: SavedRecord[] = [];
let savedRaw: string | null = null;
let unitsCache: DistanceUnit = "km";
let unitsRaw: string | null = null;

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  localStorage.setItem(key, value);
}

export function readProfile(): Profile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  const raw = readRaw(PROFILE_KEY);
  if (raw === profileRaw) return profileCache;
  profileRaw = raw;
  profileCache = parseProfile(raw);
  return profileCache;
}

export function writeProfile(next: Profile) {
  const raw = JSON.stringify(next);
  writeRaw(PROFILE_KEY, raw);
  profileRaw = raw;
  profileCache = next;
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function readSaved(): SavedRecord[] {
  if (typeof window === "undefined") return [];
  const raw = readRaw(SAVED_KEY);
  if (raw === savedRaw) return savedCache;
  savedRaw = raw;
  savedCache = parseSaved(raw);
  return savedCache;
}

export function toggleSaved(item: SavedRecord) {
  const current = readSaved();
  const exists = current.some((row) => row.kind === item.kind && row.id === item.id);
  const next = exists
    ? current.filter((row) => !(row.kind === item.kind && row.id === item.id))
    : [item, ...current];
  const raw = JSON.stringify(next);
  writeRaw(SAVED_KEY, raw);
  savedRaw = raw;
  savedCache = next;
  window.dispatchEvent(new Event(SAVED_EVENT));
}

export function readUnits(): DistanceUnit {
  if (typeof window === "undefined") return "km";
  const raw = readRaw(UNITS_KEY);
  if (raw === unitsRaw && (unitsCache === "km" || unitsCache === "mi")) return unitsCache;
  unitsRaw = raw;
  unitsCache = raw === "mi" ? "mi" : "km";
  return unitsCache;
}

export function writeUnits(unit: DistanceUnit) {
  writeRaw(UNITS_KEY, unit);
  unitsRaw = unit;
  unitsCache = unit;
  window.dispatchEvent(new Event(UNITS_EVENT));
}

export function applyThemeChoice(choice: ThemeChoice) {
  document.documentElement.dataset.todLock = "";
  paintTheme(choice, { ignoreQuery: true });
  try {
    localStorage.setItem(THEME_CHOICE_KEY, choice);
    localStorage.setItem(THEME_KEY, document.documentElement.dataset.theme || "dark");
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function clearLocalData() {
  try {
    for (const key of LOCAL_DATA_KEYS) localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
  profileRaw = null;
  profileCache = EMPTY_PROFILE;
  savedRaw = null;
  savedCache = [];
  unitsRaw = null;
  unitsCache = "km";
  window.location.reload();
}

function subscribe(name: string) {
  return (onChange: () => void) => {
    window.addEventListener(name, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(name, onChange);
      window.removeEventListener("storage", onChange);
    };
  };
}

export function useProfile(): Profile {
  return useSyncExternalStore(subscribe(PROFILE_EVENT), readProfile, () => EMPTY_PROFILE);
}

export function useSaved(): SavedRecord[] {
  return useSyncExternalStore(subscribe(SAVED_EVENT), readSaved, () => []);
}

export function useUnits(): DistanceUnit {
  return useSyncExternalStore(subscribe(UNITS_EVENT), readUnits, () => "km");
}

export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe(THEME_EVENT), readThemeChoice, () => "auto");
}

export function isSaved(items: SavedRecord[], kind: SavedRecord["kind"], id: string): boolean {
  return items.some((item) => item.kind === kind && item.id === id);
}
