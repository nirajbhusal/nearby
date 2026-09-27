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

console.log("static shell route checks passed");
