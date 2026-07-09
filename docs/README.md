# Althea — Women's Travel App

Name chosen 2026-07-03. Available domains at decision time: althea.travel,
gowithalthea.com, altheago.com, packwithalthea.com (althea.com/.app taken).
Known adjacent marks to clear with counsel before filing: Althea Korea
(K-beauty marketplace) and Dr. Althea (skincare) — beauty, not travel/apparel.

## Brand identity (locked 2026-07-03, from founder-approved concept board)

- **Tagline:** "Travel Beautifully" · positioning: "The AI travel companion
  for women who want to explore the world with confidence."
- **Wordmark:** lowercase high-contrast serif `althea` (Didot/Playfair
  class) with a compass-star motif; app icon: compass + `a` on deep navy.
- **Palette:** warm ivory ground `#F6F2EB` · deep navy ink `#22304A` ·
  dusty-rose accent `#C98F8F` (deep rose `#B96F6F` for emphasis).
- **Pillars:** Plan (smarter trips) · Pack (perfect outfits) · Explore
  (hidden gems) · Memories (last a lifetime) · Share easily.
- **Voice:** "Explore beautifully. Remember forever."
- Working prototype in this identity: see the session artifact
  (core loop v0.2 — home, packing + culture briefing, wardrobe, lookbook).

Scoping package for a new women-focused travel platform: web + mobile, simple,
polished, professional. Freemium SaaS — free tier with tasteful ads, paid
ad-free subscription.

**North star:** the world's leading travel expert for women — planning,
interesting locations, deals, and travel hacks — anchored by a signature
feature no competitor combines: *your real wardrobe, intelligently packed for
your real destination.*

## Documents

| Doc | Contents |
|-----|----------|
| [01-product-vision.md](01-product-vision.md) | Positioning, audience, monetization model |
| [02-core-features-scope.md](02-core-features-scope.md) | Wardrobe scanning · smart packing engine · outfit vision board |
| [03-optional-features-scope.md](03-optional-features-scope.md) | Meet-in-the-middle routing · travel map journal · social posting — in-app vs. standalone, feature-flag design |
| [04-tech-stack.md](04-tech-stack.md) | Recommended dev backbone (Expo, Supabase, Vercel, Claude API, GitHub) |
| [05-competitive-research.md](05-competitive-research.md) | Deep competitor research with review mining — ideas to steal, mistakes to avoid |
| [06-roadmap.md](06-roadmap.md) | Phased delivery plan with effort estimates |

## Build status

- **2026-07-03 — Phase 0 shipped** to [`tmcpherson13/althea`](https://github.com/tmcpherson13/althea):
  Expo SDK 57 app (iOS/Android/web), Althea design system, four core screens
  on the demo Marrakech dataset, deterministic packing engine with unit
  tests, Supabase schema v1 + scan-item edge function, CI, EAS + Vercel
  config. Supabase project `althea` (ref `hkbbjrtxcwmykouespnk`, us-east-1,
  $10/mo) provisioned.
- **2026-07-04 — Phase 1 slice 1 (auth + wardrobe scanning) shipped:**
  AsyncStorage-backed Supabase auth (email/password, persistent sessions),
  live/demo mode split (demo needs no login; CI/fresh clones run on mock
  data), live-or-mock data layer, and the real wardrobe-scanning flow
  (capture → scan-item/Claude vision → editable confirm → save to the
  signed-in user's closet). Web build moved to single-page SPA. All checks
  green; insert columns verified against the live schema.
  - **Blocked on user:** set `ANTHROPIC_API_KEY` on the Supabase project for
    scanning to return real results (graceful "not configured" error until then).
  - **Next slice:** packing generator (deterministic capsule selection over
    the real wardrobe) + Open-Meteo weather + culture-KB expansion + trip/plan
    persistence, so Packing/Lookbook generate from real trips.
- **2026-07-04 — Phase 1 slice 2 (packing engine) shipped:** the **Sudoku
  packing** capsule generator (see [07-sudoku-packing.md](07-sudoku-packing.md))
  — full pairwise compatibility, neutral-biased palette, bottoms-first
  seeding, statement layer, two honest outfit counts — generating real
  capsules from the user's wardrobe. Open-Meteo weather service (forecast +
  seasonal fallback), starter culture ruleset, unified Plan shape so demo and
  live share one render path, and trip persistence (geocode + weather + save;
  plan regenerated from the current closet). 41 unit tests; all checks green;
  trip insert + constraints verified against the live schema.
  - **Still needs `ANTHROPIC_API_KEY`** on the Supabase project for scanning;
    a signed-in user then scans garments → plans a trip → gets a live capsule.
- **2026-07-04 — Phase 1 slice 3 (culture + share) shipped:** culture ruleset
  expanded to **25 destinations** (Gulf, South/SE-Asia temple sites, European
  cathedral cities, Maldives resort-vs-local nuance, Japan onsen/shoes note);
  and the **outfit-board share export** — a 4:5 branded share card, an honest
  caption generator (leads with wearable looks), native share sheet
  (expo-sharing) with a Web Share/clipboard fallback, entry point on the
  Lookbook. 47 unit tests; all checks green.
- **2026-07-04 — Phase 1 slice 4 (wardrobe CRUD) shipped:** garment edit +
  delete complete the closet (was scan-add only). Tap any item → edit name,
  category, fabric, formality, coverage, or remove it; editable in the
  signed-in app, read-only in the demo.
  - **Remaining in Phase 1:** the Plus-tier paywall + gating and trips-list
    management shipped 2026-07-04 (see below). Still open: wire real billing
    into the Plus scaffold (RevenueCat account + App Store/Play products) and
    promote the culture KB to the reviewed DB table on editorial review. Still
    needs `ANTHROPIC_API_KEY` for live scanning (and `OPENAI_API_KEY` for
    voice-note transcription).

- **2026-07-04 — Travel journal module shipped** (doc 03 Module B, brought
  forward): Polarsteps-style trip recording — record moments (photo + place +
  date + note), see them plotted on an SVG route map (fitted to visited
  bounds; Mapbox tiles a later upgrade), edit/sort/delete, and **publish a
  journey recap to social** (recap card + caption → native share sheet / Web
  Share). New `journal_entries` table + private media bucket (RLS clean);
  `journal` module flag now on; Journal tab added. 57 unit tests; all checks
  green.

- **2026-07-04 — Phase 1 finish: profile, trips, Plus, voice notes shipped:**
  four slices completing the Phase 1 loop.
  - **Profile & preferences:** style register (casual → glam), sizes, home
    city. Style register feeds the packing generator (formality target biases
    capsule coverage); sizes are stored for gap-shopping links. New Profile
    screen + settings entry point; sign-out relocated here.
  - **Trips management:** keep several trips and choose the active one
    (`profiles.selected_trip_id`, ON DELETE SET NULL); list with status, make
    active, and confirm-to-delete. Home/Packing/Lookbook follow the active
    trip.
  - **Althea Plus scaffold:** `profiles.is_plus` entitlement, `useEntitlement`,
    a paywall (value prop + contextual reason copy), and free-tier caps
    enforced at the natural moments (1 live trip, 50 wardrobe items) routing to
    the paywall. RevenueCat is the documented drop-in for real billing.
  - **Journal voice notes:** record/play voice notes on moments (expo-audio;
    m4a native / webm web), stored in the private journal bucket
    (`audio_paths`), with a `transcribe-audio` edge function (Whisper) that
    folds a transcript into the note — graceful until `OPENAI_API_KEY` is set.
  - Migrations 0003–0005 applied to the live project; both edge functions
    deployed; security advisors clean. 57 unit tests; typecheck, lint, web
    export all green. Video and printed travel books remain follow-ups.

### The experience is now end-to-end (once the API key is set)

Sign in → set your style & sizes → scan & manage a wardrobe → plan (and switch
between) trips with real geocoding + weather → get a Sudoku-built capsule that
leans to your style with culture-aware day outfits → mix & match in the
Lookbook → **record the trip in the journal with photos and voice notes and
share a mapped recap.** Free-tier caps and an Althea Plus paywall are wired
(billing stubbed for RevenueCat). All verified: **57 unit tests**, typecheck,
lint, and web export green across every slice; every DB write verified against
the live schema; migrations 0003–0005 applied and both edge functions deployed
(advisors clean).

## Decisions locked (2026-07-02)

1. **Platforms:** Expo universal app — one React Native + TypeScript codebase → iOS, Android, web.
2. **MVP focus:** wardrobe → packing → outfit board (the differentiator), with trip basics included.
3. **Repo:** scoping lives here; the app gets a fresh dedicated repository when build starts.
4. **APIs:** best-of-breed paid services from day one (Claude vision, real weather + flight data).
