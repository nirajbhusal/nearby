import assert from "node:assert/strict";
import { directionsSearchHref } from "../src/components/nepal/NavigateLinks";
import { readChargeState, writeChargeSearch, type ChargeState } from "../src/lib/nepal/charge-query";
import { evIndex, isApproximate, stationsNear } from "../src/lib/nepal/ev";
import { networkChipRows, evNetworks, unbrandedCount } from "../src/lib/nepal/networks";
import { NEPAL } from "../src/lib/nepal/places";
import { provinceRecords } from "../src/lib/nepal/provinces";

assert.equal(evIndex.length, 637);
assert.equal(evIndex.filter(isApproximate).length, 75);

const provinces: Record<string, number> = {
  Bagmati: 244,
  Lumbini: 102,
  Gandaki: 96,
  Koshi: 83,
  Madhesh: 60,
  Sudurpashchim: 42,
  Karnali: 10,
};
for (const province of provinceRecords) {
  assert.equal(province.count, provinces[province.name], province.name);
}
assert.equal(
  provinceRecords.reduce((sum, province) => sum + province.count, 0),
  evIndex.length,
);

for (const network of evNetworks) {
  const count = evIndex.filter((station) => station.network_id === network.id).length;
  assert.equal(count, network.station_count, network.id);
}
assert.equal(evIndex.filter((station) => !station.network_id).length, unbrandedCount);
assert.equal(unbrandedCount, 122);

const counts = new Map<string, number>();
for (const station of evIndex) counts.set(station.network_id || "unbranded", (counts.get(station.network_id || "unbranded") ?? 0) + 1);
const chips = networkChipRows(counts);
assert.deepEqual(
  chips.primary.map((chip) => `${chip.label} ${chip.count}`),
  [
    "GadiCharge 39",
    "NEA 43",
    "MAW Vriddhi 120",
    "CG Motors 88",
    "Tata 94",
    "ElectriVa 26",
    "MG 25",
    "BYD 23",
    "Hyundai 18",
    "theeGO 17",
    "AirCharge 11",
  ],
);
assert.ok(chips.more.some((chip) => chip.id === "unbranded" && chip.count === 122));
assert.ok(!chips.primary.some((chip) => chip.id === "yatri-energy"));

const filtered = stationsNear(NEPAL, {
  radiusKm: null,
  fastOnly: false,
  plugs: [],
  networks: ["gadicharge"],
  exactOnly: false,
});
assert.equal(filtered.length, 39);

const base = readChargeState({ get: () => null });
const shared: ChargeState = {
  ...base,
  networks: ["nea", "gadicharge"],
};
assert.equal(writeChargeSearch(shared), "?network=gadicharge,nea");
const round = readChargeState({
  get: (name) => (name === "network" ? "nea,gadicharge" : null),
});
assert.deepEqual(round.networks, ["gadicharge", "nea"]);
assert.equal(round.exact, false);

const legacy = readChargeState({ get: (name) => (name === "net" ? "GadiCharge" : null) });
assert.deepEqual(legacy.networks, ["gadicharge"]);

const query = "CG EV Charging Station, Ilam Ilam";
assert.equal(directionsSearchHref(query, "ios"), `maps://?q=${encodeURIComponent(query)}`);
assert.equal(directionsSearchHref(query, "android"), `geo:0,0?q=${encodeURIComponent(query)}`);
assert.equal(
  directionsSearchHref("NAME TOWN", "desktop"),
  "https://www.google.com/maps/search/?api=1&query=NAME%20TOWN",
);

const approx = evIndex.filter((station) => station.network_id === "cg-motors" && isApproximate(station));
assert.ok(approx.length >= 68);

console.log("ev network checks passed");
