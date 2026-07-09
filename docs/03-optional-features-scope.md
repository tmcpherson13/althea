# 03 · Optional Features — Scope & In-App vs. Standalone

Requested analysis for three features: what they take to build, whether they
belong in this app or standalone, and how to make them *enableable*.

## Feature-flag architecture (how "enableable" works)

All three ship behind server-driven module flags from day one of the codebase
— zero extra architecture cost if designed in early:

```
app_modules(key, name, min_tier 'free'|'plus', default_on bool, rollout_pct)
user_modules(user_id, module_key, enabled bool)
```

- Client fetches the module map at session start; navigation and screens
  register themselves per-module (Expo Router groups: `(core)/`,
  `(modules)/meetup/`, `(modules)/journal/`…).
- Lets us: A/B test, soft-launch to Plus subscribers first, kill a module
  without an app-store release, and later *extract* a module to standalone
  with the API contract already clean.
- Use PostHog (free tier) for flags + product analytics in one tool.

**Recommendation: all three belong IN the app as optional modules, not
standalone products.** Shared reasons: they all consume the same trip object
and user graph; standalone apps would each need their own auth, billing, and
audience — tripling go-to-market cost for features that are retention/
delight layers rather than products with standalone willingness-to-pay.
Per-feature reasoning below.

---

## Module A — Meet-in-the-middle flight routing

*"I'm in Denver, my friend's in DC — where do we meet to take the long haul
together, optimizing cheapest origin, cheapest fares, fewest stops, best
times?"*

### What it takes

1. **Flight data:** the hard part. Options, in order of practicality:
   - **Duffel API** — modern developer-first flight search/booking, instant
     signup, per-search + per-booking pricing. Best MVP choice; also enables
     in-app booking (commission revenue).
   - **Kiwi.com Tequila** — strong for multi-city hacking, partner approval
     required.
   - **Amadeus Self-Service** — cheap/free test tier, industry-grade,
     rate-limited.
   - Google Flights has **no public API** — a scrape-based approach is
     ToS-fragile; don't build on it.
2. **Algorithm:** candidate-hub generation (both origins' nonstop maps ∩
   long-haul gateways: DEN×IAD → ORD, DFW, JFK, ATL…) → for each hub, price
   `origin→hub` legs + shared `hub→destination` leg → score =
   `w1·total_price + w2·stops + w3·layover_pain + w4·schedule_alignment`
   (weights user-tunable via simple sliders: "cheapest / fewest hops / most
   convenient").
   Search space is small (≤ ~30 hubs × 2 origins × a date window) — this is
   API-cost-bound, not compute-bound. Cache aggressively (fares ~15-min TTL).
3. **UX:** split-screen compare card per hub ("Meet in Chicago: you $128,
   Sarah $97, together to Lisbon $612 — save $214 vs. flying separately"),
   then hand off deep-links to book (or Duffel in-app booking later).

### Research update (doc 05 B3a)

Demand is validated (recurring Tripadvisor/Quora asks, a Frommer's article,
five independent indie tools rebuilding the same utility) and **no winner
exists**: mainstream engines are single-origin by design, the indie tools
stop at "here's a list of cities," and Troupe (JetBlue) has group voting but
no flight-data engine. The differentiated product = multi-origin
fare+schedule intersection **+ Troupe-style group voting on the results +
our women's-lens destination filter** (safety context and dress norms we
already compute for packing). Scope adds a lightweight vote/decide layer
(~+1 week) on top of the hub-finder.

### Verdict: **in-app module** (flag `meetup_routing`), Plus-tier launch perk.
It's a killer *group-travel* hook and PR-worthy demo, but no one subscribes
to a standalone hub-finder; usage is a few times per year per user. Effort:
**~5–7 engineer-weeks** (incl. group voting) + flight-API contract lead time
(start Duffel signup early).

---

## Module B — Travel photo/video map journal

Map-based trip log: route line across a beautiful map, pins with photos,
video, and **voice commentary**.

### What it takes

- **Map:** Mapbox GL (via `@rnmapbox/maps` + `mapbox-gl` on web) — custom
  branded map style is core to "polished"; generous free tier.
- **Capture:** background location breadcrumbs during trip mode
  (`expo-location`, battery-conscious deferred updates); photo/video import
  reads EXIF geotags so users can bulk-add from camera roll after the fact
  (crucial — most people journal after, not during).
- **Voice notes:** `expo-av` recording pinned to map points; auto-transcribe
  (Whisper API ~$0.006/min) so entries are searchable and captions are
  prewritten for social export.
- **Storage/cost watch:** video is the expensive part — transcode to HLS via
  Mux or Cloudflare Stream rather than raw Supabase Storage; cap free-tier
  video minutes, make generous limits a Plus perk.
- **Output:** animated route recap video (the Polarsteps signature that users
  love and share) — generate server-side with Remotion; this is the single
  best organic-marketing asset the app can produce.

### Research update (doc 05 B3)

Review mining sharpened the spec: (a) **voice notes are absent in all three
journal incumbents** — our voice-commentary plan is a real gap, not a
me-too; (b) Polarsteps' revenue is effectively 100% **printed travel books**
— add print-on-demand books (map + photos + transcribed commentary) as this
module's revenue line; (c) the category bleeds 1-star reviews on data loss,
uneditable auto-tracked routes, media caps, and coarse location privacy —
so: auto-save everything, every route segment editable, no per-post media
caps, and granular live-sharing privacy (time-delayed updates,
close-friends lists, follower exclusion — directly on-brand for a women's
safety-conscious app); (d) co-traveler permission tiers (FindPenguins lets
companions delete each other's memories — avoid).

### Verdict: **in-app module** (flag `journal`). It closes the loop —
plan → pack → *live the trip* → share — and its recap exports feed Module C.
Standalone would compete head-on with the free, entrenched Polarsteps with no
wedge. Effort: **~7–9 engineer-weeks** (map+pins 2w, capture/import 2w,
voice+transcription 1w, recap renderer 2w, privacy controls + travel-book
export pipeline 1w).

---

## Module C — Social posting (Instagram, X, Facebook, TikTok)

### What it takes — and the honest constraint

Direct API auto-posting is a permissions minefield: Instagram's content-
publishing API covers business/creator accounts (not most personal accounts),
X's free API tier is severely limited, and Meta app review takes weeks. The
pragmatic pattern (what Polarsteps/Canva actually do):

1. **Render gorgeous share assets** — outfit-board cards, map-recap videos,
   stat cards ("14 outfits from a carry-on") in per-platform aspect ratios
   (1:1, 4:5, 9:16) with tasteful watermark → organic acquisition.
2. **Native share sheet** (`expo-sharing`) → user posts to *any* app with
   their own account, zero API approval needed. Pre-filled captions +
   hashtags from trip data (and voice-note transcripts).
3. **Later, if warranted:** Meta Graph API integration for creator accounts
   + a "post at optimal time" scheduler as a Plus perk.

### Verdict: **in-app capability, not even a separate module** — share-asset
rendering rides along with the board and journal (flag `share_studio` for the
caption-AI/scheduler extras). Standalone makes no sense; it's a growth
engine for the other features. Effort: **~2–3 engineer-weeks** for renderer +
share sheet + caption generation; +3w later if/when Graph API publishing is
justified.

---

## Sequencing

| Module | When | Why |
|--------|------|-----|
| Share studio (C) | With MVP polish pass | Cheap, drives acquisition from day one |
| Map journal (B) | Phase 2 | Retention layer once core loop is proven |
| Meet-in-the-middle (A) | Phase 2–3 | Needs flight-API contract; great launch-moment PR |
