"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { List, Map as MapIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FoodList } from "@/components/food/FoodList";
import type { FoodFrame } from "@/components/food/FoodMap";
import { DirectionsLink } from "@/components/nepal/NavigateLinks";
import { Peek, PeekLoading } from "@/components/peek/Peek";
import { shareOrCopy } from "@/lib/item-link";
import { formatDistance } from "@/lib/local-profile";
import { effectiveMapScope, readMapScope, subscribeMapScope, writeMapScope } from "@/lib/map-scope";
import {
  FOOD_CITIES,
  FOOD_FILTERS,
  categoryLabels,
  cityForPlace,
  foodBBox,
  foodCity,
  foodPlaces,
  instagramHref,
  nearestFoodCity,
  siteLabel,
  spotsInCity,
  type FoodCityId,
  type FoodFilter,
  type FoodSpot,
} from "@/lib/nepal/food";
import { readFoodState, writeFoodSearch, type FoodSheet, type FoodState } from "@/lib/nepal/food-query";
import { useUnits } from "@/lib/profile-store";

const FoodMap = dynamic(() => import("@/components/food/FoodMap"), {
  ssr: false,
  loading: () => (
    <div className="charge-map">
      <PeekLoading label="Loading map" />
    </div>
  ),
});

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia("(min-width: 1024px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function desktopNow() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

export function FoodExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useMemo(() => readFoodState(searchParams), [searchParams]);
  const stateRef = useRef(state);
  const savedScope = useSyncExternalStore(subscribeMapScope, readMapScope, () => "nearby" as const);
  const scope = effectiveMapScope(searchParams.has("scope"), state.scope, savedScope);
  const desktop = useSyncExternalStore(subscribeDesktop, desktopNow, () => false);
  const unit = useUnits();
  const city = foodCity(state.city);
  const originLat = state.lat ?? city.lat;
  const originLng = state.lng ?? city.lng;
  const origin = { lat: originLat, lng: originLng };
  const spots = useMemo(
    () => spotsInCity(state.city, { lat: originLat, lng: originLng }, state.filter),
    [state.city, state.filter, originLat, originLng],
  );
  const selected = spots.find((spot) => spot.id === state.id) ?? foodPlaces.find((place) => place.id === state.id) ?? null;
  const selectedSpot: FoodSpot | null =
    selected && "distanceKm" in selected
      ? (selected as FoodSpot)
      : selected
        ? { ...selected, distanceKm: 0 }
        : null;
  const sheet: FoodSheet = state.sheet ?? "half";
  const [snapState, setSnapState] = useState<{ id: string | null; snap: FoodSheet | null }>({
    id: state.id,
    snap: null,
  });
  if (snapState.id !== state.id || (snapState.snap != null && snapState.snap === sheet)) {
    setSnapState({ id: state.id, snap: null });
  }
  const snap = (snapState.id === state.id ? snapState.snap : null) ?? sheet;
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ y: number; snap: FoodSheet; height: number; t: number } | null>(null);

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    if (!state.near || (state.lat != null && state.lng != null)) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        replace({ lat, lng, near: true, city: nearestFoodCity(lat, lng), scope: "nearby", sheet: "half" });
      },
      () => replace({ near: false }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
    // Mount-only locate when the link asks for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function replace(partial: Partial<FoodState>) {
    const next = { ...stateRef.current, ...partial };
    const search = writeFoodSearch(next);
    stateRef.current = next;
    router.replace(`/food${search}`, { scroll: false });
  }

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        replace({ lat, lng, near: true, city: nearestFoodCity(lat, lng), scope: "nearby", id: null, sheet: "half" });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }

  function chooseCity(next: FoodCityId) {
    replace({ city: next, id: null, lat: null, lng: null, near: false, sheet: "half" });
  }

  function chooseFilter(filter: FoodFilter) {
    replace({ filter, id: null });
  }

  const framed = scope === "nearby" ? spots.slice(0, 12) : spots;
  const bbox = foodBBox(framed.length ? framed : spots);
  const frame: FoodFrame = bbox
    ? { mode: "bounds", bbox, maxZoom: scope === "nearby" ? 14.5 : 13 }
    : { mode: "point", lng: city.lng, lat: city.lat, zoom: 12 };
  const listPage = state.view === "list" && !desktop;
  const countLabel = `${spots.length} place${spots.length === 1 ? "" : "s"}`;

  const citySwitch = (
    <div className="seg food-city" role="group" aria-label="City">
      {FOOD_CITIES.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={state.city === item.id}
          className={state.city === item.id ? "is-on" : undefined}
          onClick={() => chooseCity(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  const viewToggle = (
    <div className="seg" role="tablist" aria-label="Cafés and food view">
      {(
        [
          { id: "map" as const, label: "Map", icon: <MapIcon size={16} strokeWidth={1.75} aria-hidden /> },
          { id: "list" as const, label: "List", icon: <List size={16} strokeWidth={1.75} aria-hidden /> },
        ]
      ).map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={state.view === option.id}
          className={state.view === option.id ? "is-on" : undefined}
          onClick={() => replace({ view: option.id })}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );

  const filters = (
    <div className="filter-row h-scroll" role="group" aria-label="Category">
      {FOOD_FILTERS.map((item) => {
        const count = spotsInCity(state.city, origin, item.id).length;
        const on = state.filter === item.id;
        return (
          <button key={item.id} type="button" className={on ? "chip chip-on" : "chip"} aria-pressed={on} onClick={() => chooseFilter(item.id)}>
            {item.label} {count}
          </button>
        );
      })}
    </div>
  );

  const summary = (
    <div className="sheet-summary list-head">
      <p>
        {countLabel}
        {scope === "nearby" ? " · nearest first" : ""}
      </p>
      <p className="fine food-attrib">
        Data:{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap contributors
        </a>
      </p>
    </div>
  );

  function onHandlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    const panel = panelRef.current;
    dragRef.current = { y: event.clientY, snap, height: panel?.getBoundingClientRect().height ?? 0, t: performance.now() };
    panel?.classList.add("is-dragging");
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onHandlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const start = dragRef.current;
    const panel = panelRef.current;
    if (!start || !panel) return;
    const next = Math.min(window.innerHeight - 96, Math.max(120, start.height + (start.y - event.clientY)));
    panel.style.height = `${next}px`;
  }

  function onHandlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const start = dragRef.current;
    dragRef.current = null;
    panelRef.current?.classList.remove("is-dragging");
    if (!start) return;
    const dy = start.y - event.clientY;
    const velocity = dy / Math.max(1, performance.now() - start.t);
    const order: FoodSheet[] = ["peek", "half", "full"];
    let index = order.indexOf(start.snap);
    if (Math.abs(dy) < 12 && Math.abs(velocity) < 0.2) index = (index + 1) % order.length;
    else if (dy > 28 || velocity > 0.45) index = Math.min(order.length - 1, index + 1);
    else if (dy < -28 || velocity < -0.45) index = Math.max(0, index - 1);
    if (panelRef.current) panelRef.current.style.height = "";
    const next = order[index];
    setSnapState({ id: stateRef.current.id, snap: next });
    replace({ sheet: next });
  }

  const controls = (
    <div className="charge-search">
      <div className="food-toolbar">
        {citySwitch}
        {viewToggle}
      </div>
    </div>
  );

  const body = selectedSpot ? (
    <PlaceSheet
      spot={selectedSpot}
      unit={unit}
      onBack={() => replace({ id: null, sheet: "half" })}
      onShare={() =>
        shareOrCopy({
          title: selectedSpot.name,
          url: `/food${writeFoodSearch({ ...stateRef.current, id: selectedSpot.id, view: "map" })}`,
        })
      }
    />
  ) : (
    <>
      {controls}
      {filters}
      {summary}
      <div className="sheet-body">
        {spots.length === 0 ? (
          <div className="empty-block">
            <Peek size={64} state="empty" />
            <p>Nothing in this filter.</p>
          </div>
        ) : (
          <FoodList spots={spots} unit={unit} selectedId={state.id} onSelect={(id) => replace({ id, view: "map", sheet: "half" })} />
        )}
      </div>
    </>
  );

  return (
    <div className={listPage ? "charge-list-page charge-cards-page" : "charge-stage"}>
      <h1 className="sr-only">Cafés & food</h1>
      {listPage ? null : (
        <FoodMap
          spots={spots}
          origin={origin}
          frame={frame}
          selectedId={selectedSpot?.id ?? null}
          showYou={state.near && state.lat != null}
          scope={scope}
          onScope={(next) => {
            writeMapScope(next);
            replace({ scope: next });
          }}
          onSelect={(id) => {
            const place = foodPlaces.find((item) => item.id === id);
            replace({
              id,
              city: place ? cityForPlace(place) : stateRef.current.city,
              sheet: "half",
              view: "map",
            });
          }}
          onLocate={locate}
        />
      )}
      {listPage ? (
        <div className="charge-card-board">
          {controls}
          {filters}
          {summary}
          {spots.length === 0 ? (
            <div className="peek-empty">
              <Peek size={64} state="empty" />
              <p className="empty-inline">Nothing in this filter.</p>
            </div>
          ) : (
            <div className="charge-results">
              <FoodList spots={spots} unit={unit} selectedId={state.id} onSelect={(id) => replace({ id, view: "map", sheet: "half" })} />
            </div>
          )}
        </div>
      ) : (
        <section ref={panelRef} className="charge-panel" data-snap={snap} data-mode={selectedSpot ? "place" : "list"} aria-label={selectedSpot ? selectedSpot.name : "Cafés and food"}>
          <button
            type="button"
            className="sheet-handle"
            aria-label={snap === "full" ? "Shrink the list" : snap === "half" ? "Expand the list" : "Show the list"}
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
          >
            <span className="sheet-grab" />
          </button>
          {body}
        </section>
      )}
    </div>
  );
}

function PlaceSheet({
  spot,
  unit,
  onBack,
  onShare,
}: {
  spot: FoodSpot;
  unit: ReturnType<typeof useUnits>;
  onBack: () => void;
  onShare: () => void;
}) {
  const labels = categoryLabels(spot);
  const placeLine = [spot.area, spot.town, formatDistance(spot.distanceKm, unit)].filter(Boolean).join(" · ");
  return (
    <div className="station-sheet">
      <div className="station-sheet-top">
        <button type="button" className="text-btn" onClick={onBack}>
          All places
        </button>
        <button type="button" className="text-btn" onClick={onShare}>
          Share
        </button>
      </div>
      <h2 className="station-title">{spot.name}</h2>
      <p className="station-meta">{placeLine}</p>
      <p className="station-plugs food-cats">
        {labels.map((label) => (
          <span className="plug-pill" key={label}>
            {label}
          </span>
        ))}
      </p>
      <RatingLine spot={spot} />
      {spot.known_for ? <p className="lede">Known for {spot.known_for}</p> : null}
      {spot.description ? <p className="lede">{spot.description}</p> : null}
      {spot.opening_hours ? (
        <p className="station-meta">
          Hours · {spot.opening_hours}
        </p>
      ) : null}
      <div className="food-links">
        {spot.website ? (
          <a className="ink-link" href={spot.website} target="_blank" rel="noopener noreferrer">
            {siteLabel(spot.website)}
          </a>
        ) : null}
        {spot.instagram ? (
          <a className="ink-link" href={instagramHref(spot.instagram)} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        ) : null}
        {spot.phone ? (
          <a className="ink-link" href={`tel:${spot.phone.replace(/\s/g, "")}`}>
            {spot.phone}
          </a>
        ) : null}
      </div>
      <div className="food-actions">
        <a className="btn-secondary" href={spot.google_maps_url} target="_blank" rel="noopener noreferrer">
          Open in Google Maps
        </a>
        <DirectionsLink lat={spot.lat} lng={spot.lng} name={spot.name} />
      </div>
      <p className="fine food-attrib">
        Data:{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap contributors
        </a>
      </p>
    </div>
  );
}

function RatingLine({ spot }: { spot: FoodSpot }) {
  if (spot.rating == null) return null;
  const bits = [String(spot.rating), spot.rating_source, spot.rating_date].filter(Boolean);
  return <p className="food-rating">{bits.join(" · ")}</p>;
}
