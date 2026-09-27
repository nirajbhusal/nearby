import assert from "node:assert/strict";
import { readChargeState, writeChargeSearch } from "../src/lib/nepal/charge-query";
import {
  connectorLine,
  defaultStationSort,
  evIndex,
  networkMonogram,
  sortStations,
  type NearbyStation,
} from "../src/lib/nepal/ev";

assert.equal(networkMonogram("NEA"), "NEA");
assert.equal(networkMonogram("MAW Vriddhi"), "MAW");
assert.equal(networkMonogram("CG"), "CG");
assert.equal(networkMonogram("CG Motors"), "CG");
assert.equal(networkMonogram("GadiCharge"), "GC");
assert.equal(networkMonogram(null), null);
assert.equal(networkMonogram("Tata (Sipradi)"), "TATA");
assert.equal(networkMonogram("ElectriVa"), "EV");
assert.equal(networkMonogram("BYD"), "BYD");
assert.equal(networkMonogram("MG"), "MG");

const bhaktapur = evIndex.find((station) => station.id === "np-ev-evnepal-8646df46");
assert.ok(bhaktapur);
assert.equal(connectorLine(bhaktapur), "CCS2 40 kW · GB/T 80 kW");

assert.equal(defaultStationSort("geolocation"), "nearest");
assert.equal(defaultStationSort("city"), "nearest");
assert.equal(defaultStationSort("province"), "az");
assert.equal(defaultStationSort("country"), "az");

const rows = [
  row("b", "Bagmati", 4, 20, "slow"),
  row("a", "Koshi", 9, 80, "fast"),
  row("c", "Bagmati", 1, 40, "fast"),
];
assert.deepEqual(
  sortStations(rows, "nearest").map((station) => station.id),
  ["c", "b", "a"],
);
assert.deepEqual(
  sortStations(rows, "fastest").map((station) => station.id),
  ["a", "c", "b"],
);
assert.deepEqual(
  sortStations(rows, "az").map((station) => station.id),
  ["b", "c", "a"],
);

const legacy = readChargeState({ get: (name) => (name === "view" ? "cards" : null) });
assert.equal(legacy.view, "list");
assert.equal(writeChargeSearch({ ...legacy, view: "list" }), "?view=list");
assert.equal(writeChargeSearch({ ...legacy, view: "map" }), "");

console.log("charge list checks passed");

function row(id: string, province: string, distanceKm: number, kw: number, speed: string): NearbyStation {
  return {
    id,
    name: id,
    operator: null,
    network: null,
    address: null,
    city: null,
    district: null,
    province,
    lat: 0,
    lng: 0,
    speed,
    access: "public",
    phone: null,
    network_id: null,
    geo_precision: "exact",
    plugs: [{ type: "CCS2", kw, n: 1 }],
    caution: null,
    distanceKm,
  };
}
