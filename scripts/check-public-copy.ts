/**
 * Public nomad objects must not carry source-reconciliation notes.
 * Those notes stay in src/data JSON only.
 */
import assert from "node:assert/strict";
import { nomadCities } from "../src/lib/nepal/nomad";

const LEAK = /owner-provided|cross-link|city table|reconcil|matches the/i;

function walk(value: unknown, path: string) {
  if (typeof value === "string") {
    assert.equal(LEAK.test(value), false, `${path} leaks: ${value.slice(0, 120)}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) walk(item, `${path}.${key}`);
  }
}

for (const city of nomadCities) walk(city, city.slug);

const kathmandu = nomadCities.find((city) => city.slug === "kathmandu");
const pokhara = nomadCities.find((city) => city.slug === "pokhara");
assert.equal(kathmandu?.costLabel, "$908/mo");
assert.equal(pokhara?.costLabel, "$1,030/mo");
assert.equal(kathmandu?.asOfLabel, "26 Sep 2026");
assert.equal(pokhara?.asOfLabel, "26 Sep 2026");
assert.ok(kathmandu?.sourceUrl?.includes("nomads.com"));
assert.ok(pokhara?.sourceUrl?.includes("nomads.com"));

console.log("public nomad copy checks passed");
