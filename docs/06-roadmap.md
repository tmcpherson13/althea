# 06 · Roadmap

Estimates assume one strong full-stack developer working AI-assisted; a
two-person team roughly halves calendar time. Effort details per feature are
in docs 02–03.

## Phase 0 — Foundations (≈2 weeks)

- New repo, Expo app scaffold + Expo Router module groups, design system
  (theme, type scale, core components), Supabase project (auth, schema v1,
  RLS), CI (GitHub Actions + EAS + Vercel previews), PostHog flags, Sentry.
- Brand: **Althea** (chosen 2026-07-03). Remaining: register domains
  (althea.travel / gowithalthea.com / altheago.com), attorney trademark
  clearance in classes 9/42/39/35 (note Althea Korea + Dr. Althea in
  beauty), wordmark + palette.

## Phase 1 — Core MVP (≈8–10 weeks) → TestFlight/Play beta

1. Wardrobe capture + catalogue (doc 02, feature 1)
2. Trip creation + packing engine + culture KB for top ~30 destinations
   (doc 02, feature 2)
3. Outfit vision board + share-asset export (doc 02 feature 3 + doc 03
   module C's renderer)
4. Free tier complete; RevenueCat wired with Plus tier gating (even if
   payment flips on later).

**Beta gate:** 50–100 women travelers recruited from travel-community
channels; success = activation/magic-moment metrics in doc 01.

## Phase 2 — Retention & delight (≈6–8 weeks) → public launch

- Map journal module (doc 03 B) with recap videos; printed travel-book
  pipeline follows once journal usage proves out (Polarsteps' entire
  revenue engine — doc 05)
- Deal alerts v1 (fare tracking on saved routes) + travel-hack content
  surface
- Ads integration on free tier (native placements only) + Plus paywall on
- Culture KB expansion to ~100 destinations

## Phase 3 — Growth (≈6–8 weeks)

- Meet-in-the-middle routing (doc 03 A; Duffel contract started in Phase 1)
- Social scheduler / Graph API publishing if beta demand supports it
- Wardrobe import shortcuts (receipt parsing), stylist-quality "capsule
  audit" premium feature
- Referral loop: shared boards/recaps carry invite links

## Standing risks & mitigations

| Risk | Mitigation |
|------|------------|
| Garment classification accuracy disappoints | One-tap confirm UX; measure edit-rate per attribute from day one |
| Culture-norm advice is wrong/offensive | Editorial review before publish; per-destination sources; user-report loop; conservative defaults |
| Flight API partnership delays | Duffel instant signup first; hub-finder ships behind flag whenever ready |
| App Store review friction (affiliate links, ads) | Follow store affiliate-disclosure rules; ads only via approved SDKs; web tier unaffected |
| Scope creep into full trip-planner | Doc 01 principle: integrate (calendar/maps deep links), don't rebuild Wanderlog |
| Free AI stylists (Alta, Whering) commoditize the styling brain | Paid tier sells travel expertise (culture briefings, deals, trip tools), not styling alone; affiliate layer monetizes free users either way (doc 05 B4) |
| Trust failures (billing, data loss) — the category's #1 review killer | Local-first data, auto-save, clean cancellation, no dark patterns — treated as product requirements, not ops details |
