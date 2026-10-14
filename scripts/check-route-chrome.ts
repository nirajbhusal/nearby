import assert from "node:assert/strict";
import { isChargeRoute, moreActive, pageTitle, tabActive } from "../src/lib/route-chrome";

assert.equal(pageTitle("/events"), "Tech events");
assert.equal(pageTitle("/events/"), "Tech events");
assert.equal(pageTitle("/nearby/events/"), "Tech events");
assert.equal(isChargeRoute("/events"), false);
assert.equal(tabActive("/events", "/charge"), false);
assert.equal(tabActive("/events", "/events"), true);
assert.equal(tabActive("/ev/station", "/charge"), true);
assert.equal(tabActive("/events", "/events"), true);
assert.equal(pageTitle("/ev/station"), "Charging stations");
assert.equal(pageTitle("/charge"), "Charging stations");
assert.equal(pageTitle("/"), "Nearby");
assert.equal(tabActive("/", "/"), true);
assert.equal(tabActive("/learn", "/learn"), true);
assert.equal(moreActive("/learn"), true);
assert.equal(moreActive("/events"), false);
assert.equal(pageTitle("/nomad/pokhara"), "Pokhara");
assert.equal(pageTitle("/nomad"), "Digital nomads");
assert.equal(pageTitle("/nomad/kathmandu"), "Digital nomads");
assert.equal(pageTitle("/jobs"), "Tech jobs");
assert.equal(pageTitle("/learn"), "Learn AI");
assert.equal(pageTitle("/profile"), "Profile");

console.log("route chrome unit checks passed");
