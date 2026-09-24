# Nearby

Jobs & AI meetups near you.

**Live:** [https://nirajbhusal.github.io/nearby/](https://nirajbhusal.github.io/nearby/)

A soft, place-first finder — not a traditional job board. Tell Nearby where you
are (and optionally what kind of work you want); it ranks curated companies by
location overlap and a light role-intent match, and surfaces upcoming AI meetups
the same way.

The public site is a static export. Search runs in the browser from
`prisma/seed-data.json` and `prisma/seed-events.json`. GitHub Pages does not
run the Next.js server or Prisma.

## How to run

```bash
npm install
npm run dev
```

Open [http://localhost:3000/nearby](http://localhost:3000/nearby). The `/nearby`
prefix matches the GitHub Pages project path (`basePath`).

Prisma is optional. The dev server and the static build both read the seed JSON
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
`out/` and deploys it with GitHub Pages (Actions source).

### First-time GitHub Pages setup

Pages is not enabled until someone with admin access turns it on. The Actions
workflow cannot do that itself (`actions/configure-pages` only reads an existing
Pages site unless a token with `administration:write` is provided).

1. Open **Settings → Pages → Build and deployment**.
2. Set **Source** to **GitHub Actions**.
3. Re-run the failed **Deploy to GitHub Pages** workflow (or push to `main` again).

After that, every push to `main` publishes
[https://nirajbhusal.github.io/nearby/](https://nirajbhusal.github.io/nearby/).

## Try the nearby flow

1. On the home page, type a city (e.g. `San Francisco`) or tap **Use my location**.
2. Optionally add a role intent (`product designer`, `ML engineer`).
3. Press **Find nearby** — you’ll get a short summary, an illustrated place card,
   soft recommendation rows with “Open roles →” links, and AI meetups nearby.

“Use my location” asks the browser for coordinates and reverse-geocodes them
with Nominatim. Company pages are prebuilt from the seed list.

## Product vision

1. Place-first discovery — one prompt, not filters + grids.
2. Recommendations that feel like an answer, not a directory.
3. Continuously curated company inventory under the hood.
4. Stay lightweight — seed JSON in the browser, heuristic ranking (no paid API keys).

## Stack

Next.js App Router (static export) · TypeScript · Tailwind CSS · optional Prisma · SQLite

## Seed data

The site ranks companies from `prisma/seed-data.json` and AI meetups from
`prisma/seed-events.json`. Inventory stays curated; it is not presented as a
browseable job board. `npm run seed` can load that same JSON into SQLite for
local experiments.
