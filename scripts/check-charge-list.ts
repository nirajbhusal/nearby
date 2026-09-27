import assert from "node:assert/strict";
import { readChargeState, writeChargeSearch } from "../src/lib/nepal/charge-query";
import {
  connectorLine,
  defaultStationSort,
  evIndex,
  networkMonogram,
  sortStations,
  stationPlaceName,
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
assert.equal(defaultStationSort("area"), "nearest");
assert.equal(defaultStationSort("district"), "nearest");
assert.equal(defaultStationSort("province"), "nearest");
assert.equal(defaultStationSort("country"), "nearest");
assert.equal(defaultStationSort(), "nearest");

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
assert.equal(readChargeState({ get: () => null }).view, "list");
assert.equal(readChargeState({ get: (name) => (name === "view" ? "map" : null) }).view, "map");
assert.equal(writeChargeSearch({ ...legacy, view: "list" }), "");
assert.equal(writeChargeSearch({ ...legacy, view: "map" }), "?view=map");
assert.equal(readChargeState({ get: () => null }).sort, null);
assert.equal(readChargeState({ get: (name) => (name === "sort" ? "az" : null) }).sort, "az");
assert.equal(readChargeState({ get: (name) => (name === "sort" ? "fastest" : null) }).sort, "fastest");
assert.equal(readChargeState({ get: (name) => (name === "sort" ? "nearest" : null) }).sort, null);
assert.equal(writeChargeSearch({ ...legacy, sort: "az" }), "?sort=az");
assert.equal(writeChargeSearch({ ...legacy, sort: "fastest" }), "?sort=fastest");
assert.equal(writeChargeSearch({ ...legacy, sort: null }), "");
assert.equal(
  stationPlaceName({ name: "GadiCharge - Bluebird Complex, Thapathali", network: "GadiCharge", network_id: "gadicharge" }),
  "Bluebird Complex, Thapathali",
);
assert.equal(
  stationPlaceName({ name: "GadiCharge-Citizen Bank, Durbarmarg", network: "GadiCharge", network_id: "gadicharge" }),
  "Citizen Bank, Durbarmarg",
);
assert.equal(
  stationPlaceName({
    name: "AirCharge Fast Charging, Hotel Harati Crown, Bidur",
    network: "AirCharge",
    network_id: "aircharge",
  }),
  "Hotel Harati Crown, Bidur",
);
assert.equal(
  stationPlaceName({
    name: "Tata Power EZ Charge - Lakeside, Pokhara",
    network: "Tata (Sipradi)",
    network_id: "tata-sipradi",
  }),
  "Lakeside, Pokhara",
);
assert.equal(
  stationPlaceName({ name: "theeGO - Thamel", network: "Thee Go", network_id: "thee-go" }),
  "Thamel",
);
assert.equal(
  stationPlaceName({ name: "theeGO Chargepoint, Kathmandu", network: "Thee Go", network_id: "thee-go" }),
  "Kathmandu",
);
assert.equal(
  stationPlaceName({ name: "NEA Charging Station CCS, Kharipati", network: "NEA", network_id: "nea" }),
  "CCS, Kharipati",
);
assert.equal(
  stationPlaceName({ name: "NEA CCS Ratnapark", network: "NEA", network_id: "nea" }),
  "NEA CCS Ratnapark",
);
assert.equal(
  stationPlaceName({ name: "CG Charging Station", network: "CG Motors", network_id: "cg-motors" }),
  "CG Charging Station",
);
assert.equal(
  stationPlaceName({ name: "AirCharge Fast Charging, Hotel Harati Crown, Bidur", network: null }),
  "AirCharge Fast Charging, Hotel Harati Crown, Bidur",
);
assert.equal(
  stationPlaceName({
    name: "TATA Motors Lalitpur - JB Automotive Company",
    network: "Tata (Sipradi)",
    network_id: "tata-sipradi",
  }),
  "TATA Motors Lalitpur - JB Automotive Company",
);

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
