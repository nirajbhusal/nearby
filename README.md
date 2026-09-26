# Nearby

A Nepal-only guide for finding, checking, and navigating to EV chargers, plus
tech jobs, places to learn AI, tech events, and a digital nomad section.

**Live:** [https://nirajbhusal.github.io/nearby/](https://nirajbhusal.github.io/nearby/)

Open the charger map, search a city (or use your location), and tap Navigate.
Jobs, Learn, Events, and Nomad are separate sections. The public site is a
static export. Search runs in the browser from JSON in `src/data/nepal/`.
GitHub Pages does not run a Next.js server.

## How to run

```bash
npm install
npm run dev
```

Open [http://localhost:3000/nearby](http://localhost:3000/nearby). The `/nearby`
prefix matches the GitHub Pages project path (`basePath`).

Prisma is optional. The dev server and the static build both read the JSON
files, so you do not need a database to work on the site.

### Optional local database

The SQLite seed is kept for local experiments. It is not part of the public site.

```bash
DATABASE_URL="file:./prisma/dev.db" npx prisma migrate dev
DATABASE_URL="file:./prisma/dev.db" npm run seed
```

The SQLite file lives at `prisma/dev.db` (no cloud credentials).

### Static build

```bash
npm run build
```

This writes the site to `out/`. Pushing to `main` runs
[`.github/workflows/pages.yml`](.github/workflows/pages.yml), which uploads
`out/` and deploys it with GitHub Pages.

Pages is enabled for this repo (source: GitHub Actions). A push to `main`
publishes [https://nirajbhusal.github.io/nearby/](https://nirajbhusal.github.io/nearby/).

## Try it

1. Home leads with **Find a charger near me**.
2. The charger map opens full screen. Search `Pokhara` or `Kathmandu`, or use the locate button.
3. Filter with Fast only, CCS2, GB/T, Type 2, CHAdeMO, or a network. The pins and the list update together.
4. Open a station and tap **Navigate**.
5. Jobs, Learn, and Events take a place query, for example `/jobs?q=Kathmandu`.
6. Nomad cities live at `/nomad/kathmandu` and `/nomad/pokhara`.

## Data

Nepal records live in `src/data/nepal/` and are labeled **curated** in the UI.
They were compiled on 26 Sep 2026 from public pages. They are not
field-verified.

| File | What it is |
| --- | --- |
| `ev-stations.json` | 502 EV charging stations (full record, loaded when a station sheet opens and for detail pages) |
| `ev-index.json` | Slim station list for pins and the list |
| `companies.json` | 61 Nepal tech companies and their open roles |
| `learn.json` | 27 places to learn AI, with programs |
| `events.json` | 63 tech and AI events |
| `places.json` | City, district, and province centroids used for search |
| `nomad-cities.json` | Digital nomad cities. Only sourced figures are filled in |

### Nomad city schema

`nomad-cities.json` is a `{ "cities": NomadCity[] }` document. The TypeScript
types live in `src/lib/nepal/nomad.ts`. Each city has `slug`, `name`,
`province`, `lat`, `lng`, a `stats` array, and these sections:

- `internet` — a stat, or `null`
- `bestSeason` — a note, or `null`
- `coworking`, `cafes`, `neighbourhoods` — place arrays
- `visa`, `sim` — a note, or `null`
- `tips` — note array

Every stat, place, and note needs `source`, `sourceUrl` (or `null`), and
`asOf`. Leave a section empty rather than adding an unsourced number.

Current figures, both credited “Source: Nomads.com (nomads.com), as of Sep 2026”:

- Kathmandu: Nomads.com rank #11, cost for a nomad about USD 906/month
- Pokhara: Nomads.com rank #61, cost for a nomad about USD 1,027/month

Credits: OpenStreetMap contributors (map tiles, and some station coordinates);
public operator directories; official company, campus, and organizer pages.
Office coordinates in the jobs set are city centroids. Station access is often
unknown — the UI says to call ahead instead of assuming a charger is public.

## Stack

Next.js App Router (static export) · TypeScript · Tailwind CSS · Leaflet /
OpenStreetMap · optional Prisma · SQLite
