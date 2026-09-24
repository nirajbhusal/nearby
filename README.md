# Nearby

Jobs & AI meetups near you.

A soft, place-first finder — not a traditional job board. Tell Nearby where you
are (and optionally what kind of work you want); it ranks curated companies by
location overlap and a light role-intent match, and surfaces upcoming AI meetups
the same way.

## How to run

```bash
npm install
npx prisma migrate dev --name init   # or: npx prisma db push
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

SQLite DB lives at `prisma/dev.db` (no cloud credentials needed).

## Try the nearby flow

1. On the home page, type a city (e.g. `San Francisco`) or tap **Use my location**.
2. Optionally add a role intent (`product designer`, `ML engineer`).
3. Press **Find nearby** — you’ll get a short summary, an illustrated place card,
   soft recommendation rows with “Open roles →” links, and AI meetups nearby.

API: `POST /api/nearby` with `{ "place": "San Francisco", "intent": "engineer" }`.
Upcoming meetups: `GET /api/events?limit=5`.

## Product vision

1. Place-first discovery — one prompt, not filters + grids.
2. Recommendations that feel like an answer, not a directory.
3. Continuously curated company inventory under the hood.
4. Stay lightweight — local SQLite MVP, heuristic ranking (no paid API keys).

## Stack

Next.js App Router · TypeScript · Tailwind CSS · Prisma · SQLite

## Seed data

Seed loads from `prisma/seed-data.json`. Companies are kept as backend inventory
for ranking; they are not presented as a browseable job board.
