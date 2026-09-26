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
| `nomad-cities.json` | Kathmandu and Pokhara: sourced stats, coworking, and cafés |
| `nomad-stays.json` | Verified stays and best areas to live. Excluded candidates stay in the file and are not shown |

### Nomad cities and stays

`nomad-cities.json` lists each city with a short introduction, Nomads.com
stats, coworking spaces, and cafés. Every coworking space and café has an
`id`. Shared visa, SIM, season, and tip notes sit under `nepal`. Ookla is an
outbound link only — the page does not print Speedtest figures. Types for the
view the pages use live in `src/lib/nepal/nomad.ts`.

`nomad-stays.json` is the stay list those pages render: area, type, features,
a price only when the source states one, and distances to the coworking and
café ids. Leave a stay or a price out rather than adding an unsourced one.

Nomads.com figures shown in the app, labeled “Source: Nomads.com, as of 26 Sep 2026”.
The ranking changes daily. The app uses the city-table values:

- Kathmandu: rank #12, cost for a nomad USD 908/month. Nomads.com cross-link cards on the same site show $906.
- Pokhara: rank #60, cost for a nomad USD 1,030/month. The page description and cross-link cards show $1,027.

Credits: OpenStreetMap contributors (map tiles, and some station and stay
coordinates); public operator directories; official company, campus, and
organizer pages. A company office is a building or street point, an area, or
still the city centre, and the jobs map marks which. Station access is often
unknown — the UI says to call ahead instead of assuming a charger is public.

## Stack

Next.js App Router (static export) · TypeScript · Tailwind CSS · MapLibre GL /
OpenFreeMap (OpenStreetMap) · optional Prisma · SQLite
