import assert from "node:assert/strict";
import { isChargeRoute, moreActive, pageTitle, tabActive } from "../src/lib/route-chrome";

assert.equal(pageTitle("/events"), "Events");
assert.equal(pageTitle("/events/"), "Events");
assert.equal(pageTitle("/nearby/events/"), "Events");
assert.equal(isChargeRoute("/events"), false);
assert.equal(tabActive("/events", "/charge"), false);
assert.equal(tabActive("/events", "/events"), true);
assert.equal(tabActive("/ev/station", "/charge"), true);
assert.equal(tabActive("/events", "/events"), true);
assert.equal(pageTitle("/ev/station"), "Charge");
assert.equal(pageTitle("/charge"), "Charge");
assert.equal(pageTitle("/"), "Nearby");
assert.equal(tabActive("/", "/"), true);
assert.equal(tabActive("/learn", "/learn"), true);
assert.equal(moreActive("/learn"), true);
assert.equal(moreActive("/events"), false);
assert.equal(pageTitle("/nomad/pokhara"), "Pokhara");
assert.equal(pageTitle("/nomad"), "Nomad");
assert.equal(pageTitle("/nomad/kathmandu"), "Nomad");
assert.equal(pageTitle("/jobs"), "Jobs");
assert.equal(pageTitle("/profile"), "Profile");

console.log("route chrome unit checks passed");
