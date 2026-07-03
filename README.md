# ✦ althea — Travel Beautifully

The AI travel companion for women who want to explore the world with
confidence. Althea knows your closet: tell her where you're going and she
packs it — weather-right, culturally respectful, fashionable, and ruthlessly
carry-on efficient.

Full product scoping and competitive research:
[`tmcpherson13/crucible-platform → docs/travel-app/`](https://github.com/tmcpherson13/crucible-platform/tree/claude/womens-travel-app-scope-qkzea6/docs/travel-app).

## Stack

- **Expo** (React Native + TypeScript) — one codebase → iOS, Android, web
- **Expo Router** — `(tabs)` core app + `(modules)/` feature-flagged groups
- **Supabase** — Postgres + Auth + Storage + Edge Functions (`supabase/`)
- **Claude API** — wardrobe vision scanning + packing judgment (server-side only)

## Develop

```bash
npm install
npm start          # Expo dev server (i = iOS sim, a = Android, w = web)

npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
npm test           # vitest — pure-logic tests for the packing engine
```

Copy `.env.example` → `.env` with your Supabase project keys to leave demo
mode; without them the app runs fully on the mock Marrakech dataset.

## Layout

```
src/
  app/            expo-router routes
    (tabs)/       Home · Wardrobe · Packing · Lookbook
    new-trip.tsx  capsule-builder modal
  components/ui/  design system (tokens in constants/theme.ts)
  lib/
    engine.ts     deterministic packing/validation rules (unit-tested)
    mock.ts       demo dataset (Marrakech) — mirrors the Supabase schema
    modules.ts    feature-flag registry (journal, meetup, deals, share studio)
supabase/
  migrations/     schema v1: wardrobe, trips, plans, outfits, boards, culture KB
  functions/
    scan-item/    Claude vision → structured garment JSON
```

## Deploy

- **Apps:** EAS Build (`eas.json` — development / preview / production channels)
- **Web:** `npx expo export --platform web` → static `dist/`, hosted on Vercel
- **CI:** `.github/workflows/ci.yml` — typecheck, lint, tests, web export on every PR
