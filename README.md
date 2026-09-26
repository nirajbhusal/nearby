# Nearby

A Nepal-first finder for EV charging, tech jobs, places to learn AI, and tech
and AI events.

**Live:** [https://nirajbhusal.github.io/nearby/](https://nirajbhusal.github.io/nearby/)

Tell Nearby a place in Nepal (or use your location). It sorts curated EV
chargers by distance, and lists tech companies, AI programs, and events around
that place. A separate worldwide view still covers jobs and AI meetups outside
Nepal.

The public site is a static export. Search runs in the browser from JSON in
`src/data/nepal/`, plus `prisma/seed-data.json` and `prisma/seed-events.json`
for the worldwide lists. GitHub Pages does not run a Next.js server.

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

Contributors who want the SQLite copy used by `npm run seed`:

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

1. Open the home page. It starts in Kathmandu, on EV charging.
2. Search a Nepal place (`Pokhara`, `Patan`, `Chitwan`, `Butwal`) or tap **Use my location**.
3. Switch **Jobs**, **Learn AI**, and **Events**. Filter with the chips.
4. Open a station for connectors, phone, and **Navigate** (Google Maps, with Apple Maps beside it).
5. **Worldwide** keeps the older jobs and AI meetup search.

## Data

Nepal records live in `src/data/nepal/` and are labeled **curated** in the UI.
They were compiled on 26 Sep 2026 from public pages. They are not
field-verified.

| File | What it is |
| --- | --- |
| `ev-stations.json` | 502 EV charging stations (full record, used for detail pages) |
| `ev-index.json` | Slim station list for search and the map |
| `companies.json` | 61 Nepal tech companies and their open roles |
| `learn.json` | 27 places to learn AI, with programs |
| `events.json` | 63 tech and AI events |
| `places.json` | City, district, and province centroids used for search |

Credits: OpenStreetMap contributors (map tiles, and some station coordinates);
public operator directories; official company, campus, and organizer pages.
Office coordinates in the jobs set are city centroids. Station access is often
unknown — the UI says to call ahead instead of assuming a charger is public.

Worldwide companies and meetups still come from `prisma/seed-data.json` and
`prisma/seed-events.json`.

## Stack

Next.js App Router (static export) · TypeScript · Tailwind CSS · Leaflet /
OpenStreetMap · optional Prisma · SQLite
