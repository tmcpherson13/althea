# 04 · Recommended Dev Backbone

You asked "Git, Supa, Vercel, etc.?" — short answer: **yes, exactly that
trio, plus Expo and Claude.** Boring-but-excellent infrastructure so all the
innovation budget goes into the product.

## The stack

| Layer | Choice | Why |
|-------|--------|-----|
| **App framework** | **Expo (React Native) + TypeScript + Expo Router** | One codebase → iOS + Android + web (per your platform decision). First-class camera, EAS cloud builds mean no Mac required to ship iOS. |
| **UI** | Tamagui (or NativeWind) + custom design system | Polished, performant, styled once for native + web. "Editorial fashion" look needs a custom theme layer regardless. |
| **Backend** | **Supabase** (Postgres + Auth + Storage + Edge Functions + Realtime) | Auth (Apple/Google/email) out of the box, row-level security fits privacy-sensitive wardrobe data, Storage for garment photos, Edge Functions for AI orchestration. Already connected to this workspace. |
| **Web hosting** | **Vercel** | Hosts the Expo web build + marketing site; preview deploys per PR. Already connected. |
| **AI** | **Claude API** (claude-sonnet-5 default; claude-haiku-4-5 for cheap classification) | Vision for wardrobe scanning, packing "judgment pass", culture-content drafting, caption writing. |
| **Payments** | RevenueCat + Stripe | One SDK for App Store, Play Billing, and web subscriptions. |
| **Flags + analytics** | PostHog | Feature flags for the module system + funnels/retention in one free-tier tool. |
| **Errors** | Sentry | RN + web coverage. |
| **Maps** | Mapbox | Custom-branded maps for journal module. |
| **Media** | Supabase Storage (photos) · Mux or Cloudflare Stream (video, Phase 2) | Don't serve raw video from Postgres-adjacent storage. |
| **Flights** | Duffel (primary), Amadeus Self-Service (backup/enrichment) | See doc 03, Module A. |
| **Weather** | Open-Meteo (free) → Tomorrow.io if SLA needed | Forecast + climate normals, no key to start. |
| **CI/CD** | **GitHub** + Actions + EAS Build/Submit + Vercel integration | PR checks (typecheck, lint, vitest, Playwright web E2E), EAS for store builds + OTA updates (`expo-updates`) — ship JS fixes without app review. |

## Architecture sketch

```
 Expo app (iOS / Android / Web on Vercel)
        │  supabase-js (RLS-scoped)
        ▼
 Supabase ── Postgres (wardrobe, trips, outfits, boards, modules, culture KB)
        │    Auth · Storage (photos) · Realtime (future co-planning)
        ▼
 Edge Functions (Deno) — the "brain" seam:
   /scan-item      → Claude vision → structured garment JSON
   /plan-packing   → capsule optimizer + Claude judgment pass
   /find-hub       → Duffel fan-out + scoring        (module A)
   /render-share   → share-asset & recap generation  (module C/B)
        │
        ▼
 Claude API · Duffel · Open-Meteo · affiliate APIs (Amazon PA-API, ShopStyle)
```

Key seam: **all AI and third-party calls live in Edge Functions**, never in
the client — keys stay server-side, costs are meterable per user/tier, and
the client stays a thin, fast UI. If we ever outgrow Edge Functions
(long-running video rendering), lift those endpoints to a small Fly.io/Render
service without touching the client.

## Why not the alternatives

- **Next.js + separate native apps:** better web ceiling, ~40% more work,
  two codebases to polish — rejected with the platform decision.
- **Firebase:** comparable, but Postgres + RLS + SQL beats Firestore for the
  relational wardrobe/outfit/trip model, and Supabase is already wired into
  this workspace.
- **Custom Node/Go backend on day one:** premature; Supabase covers 90% and
  the Edge Function seam keeps an escape hatch.

## Repo plan (when build starts)

Fresh dedicated repo (per your decision), single Expo app + `supabase/`
folder (migrations, edge functions) in one repository — a true monorepo split
(`apps/`, `packages/`) only if a second app appears. Trunk-based development,
preview deploys on every PR, `main` auto-deploys web to Vercel and OTA to
Expo channels.
