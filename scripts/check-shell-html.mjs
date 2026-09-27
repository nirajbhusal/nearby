/**
 * Direct-load check against the static export. Each route's HTML must carry
 * the header title and a single active tab for that route.
 */
import assert from "node:assert/strict";
import fs from "node:fs";

const cases = [
  ["out/index.html", "", "Home"],
  ["out/charge/index.html", "Charge", "Charge"],
  ["out/jobs/index.html", "Jobs", "Jobs"],
  ["out/events/index.html", "Events", "Events"],
  ["out/learn/index.html", "Learn", "More"],
  ["out/nomad/index.html", "Nomad", "More"],
  ["out/nomad/kathmandu/index.html", "Nomad", "More"],
  ["out/nomad/pokhara/index.html", "Pokhara", "More"],
  ["out/profile/index.html", "Profile", "More"],
  ["out/ev/np-ev-evnepal-8646df46/index.html", "Charge", "Charge"],
];

function activeLabels(html) {
  const start = html.indexOf('class="tab-bar"');
  const tab = html.slice(start, html.indexOf("</nav>", start));
  const labels = [];
  for (const match of tab.matchAll(/aria-current="page"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)) {
    labels.push(match[1]);
  }
  return labels;
}

for (const [file, title, tab] of cases) {
  const html = fs.readFileSync(file, "utf8");
  const found = html.match(/class="mobile-title"[^>]*>([^<]*)</);
  assert.ok(found, `${file} missing mobile title`);
  assert.equal(found[1], title, `${file} title`);
  const labels = activeLabels(html);
  assert.deepEqual(labels, [tab], `${file} active tabs ${labels.join(",")}`);
  if (tab !== "Charge") assert.equal(html.includes('href="/nearby/charge/" aria-current="page"'), false, `${file} charge tab`);
}

const nomad = fs.readFileSync("out/nomad/index.html", "utf8");
for (const heading of ["Best areas to live", "Stays", "Coworking", "Cafés"]) {
  assert.ok(nomad.includes(heading), `nomad index missing ${heading}`);
}

const LEAK = /owner-provided|cross-link|city table|reconcil|matches the/i;
function visible(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}
const pages = [
  "out/index.html",
  "out/jobs/index.html",
  "out/events/index.html",
  "out/learn/index.html",
  "out/nomad/index.html",
  "out/nomad/kathmandu/index.html",
  "out/nomad/pokhara/index.html",
  "out/charge/index.html",
];
for (const file of pages) {
  const text = visible(fs.readFileSync(file, "utf8"));
  assert.equal(LEAK.test(text), false, `${file} shows a reconciliation note`);
}
const ktm = visible(fs.readFileSync("out/nomad/kathmandu/index.html", "utf8"));
const pkr = visible(fs.readFileSync("out/nomad/pokhara/index.html", "utf8"));
assert.ok(ktm.includes("$908/mo"), "Kathmandu cost");
assert.ok(ktm.includes("Nomads.com · 26 Sep 2026"), "Kathmandu source line");
assert.ok(pkr.includes("$1,030/mo"), "Pokhara cost");
assert.ok(pkr.includes("Nomads.com · 26 Sep 2026"), "Pokhara source line");
assert.equal(ktm.includes('class="eyebrow"'), false, "Kathmandu eyebrow");
const events = visible(fs.readFileSync("out/events/index.html", "utf8"));
assert.equal(events.includes("missing price"), false, "events internal helper");
assert.equal(events.includes("today's date"), false, "events internal helper");

console.log("static shell route checks passed");
