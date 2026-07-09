# 02 · Core Features — Detailed Scope

The three launch features form one pipeline:

```
Wardrobe Catalog  ──►  Packing Engine  ──►  Outfit Vision Board
   (what you own)      (what to bring)       (how to wear it)
```

---

## Feature 1 — Wardrobe scan & catalogue

### User experience

- **Photo capture:** snap a garment (flat-lay or hanging). App auto-removes
  the background, classifies it, and pre-fills attributes; user confirms in
  one tap. Batch mode: photograph a rail of clothes, app segments items.
- **Tag scan:** photograph the care/brand tag → OCR extracts brand, size,
  fabric composition (fabric matters: linen vs. polyester changes hot-climate
  recommendations and wrinkle/laundry logic).
- **Import shortcuts (later):** email-receipt parsing, screenshot-your-order.

### Pipeline (per item)

1. Upload photo → Supabase Storage.
2. Background removal (on-device via Apple VisionKit / `rembg`-style model
   server-side for Android/web; fallback: keep original).
3. **Claude vision call** returns structured JSON: category, subcategory,
   colors (dominant + accent), pattern, fabric guess, warmth rating,
   formality (1–5), coverage attributes (sleeves, neckline, hem length —
   feeds culture-norm engine), style tags, season tags.
4. User confirms/edits → row in `wardrobe_items`.

Cost: ~$0.01–0.03/item with Claude on a resized image. A 150-item closet
costs well under $5 to fully catalogue — fine even on the free tier with a
50-item cap.

### Data model (core tables)

```
wardrobe_items(id, user_id, photo_url, cutout_url, category, subcategory,
               colors[], pattern, fabric, warmth, formality, coverage jsonb,
               style_tags[], seasons[], brand, size, source, created_at)
outfits(id, user_id, name, item_ids[], occasion_tags[], created_by 'user'|'ai')
```

### Effort

~4–6 engineer-weeks: capture UX 2w, vision pipeline + prompt tuning 1.5w,
catalog browse/edit UI 1.5w, background removal 1w. Highest-risk element is
classification accuracy → mitigate with the one-tap confirm step (humans fix
AI errors cheaply at capture time).

---

## Feature 2 — Destination-aware packing engine

### Inputs

- Trip: destination(s), dates, trip type (leisure/business/adventure/event),
  planned activities (beach, hiking, fine dining, religious sites…), luggage
  constraint (carry-on / checked / weekend bag), laundry access.
- Weather: Open-Meteo (free, no key) or Tomorrow.io — 16-day forecast when
  in range, else climate normals for the dates.
- **Culture-norm knowledge base (our moat):** per-country/region structured
  guidance — required/expected coverage, religious-site rules, beachwear
  norms, conservative vs. cosmopolitan area notes, seasonal formality.
  Built AI-first, *editorially reviewed*, versioned in our DB. This must be
  reviewed content, not a live LLM guess.
- Fashion register: user picks a vibe (casual / smart-casual / polished /
  glam) → engine targets formality bands so users are neither over- nor
  under-dressed.

### Algorithm (deterministic core + LLM garnish)

1. Build **day-slots**: each day × occasion (daytime, evening, activity) with
   weather band + formality band + coverage constraints.
2. **Capsule optimizer** (pure code, not LLM): greedy/ILP selection that
   maximizes slot coverage per item, rewarding re-wear across outfits —
   "5 tops + 4 bottoms + 2 layers = 20 outfits" logic. Hard constraints:
   luggage volume/weight model, laundry cadence, culture-coverage rules.
3. **Claude pass** for judgment: color-harmony sanity check across the
   capsule, "why" strings per item, day-by-day outfit assignments, and the
   gap list.
4. **Gap → shop:** items the optimizer wanted but the closet lacks ("packable
   rain shell", "modest maxi dress") → product search via affiliate APIs
   (Amazon PA-API, ShopStyle Collective; later LTK) filtered by user's sizes
   from the catalog. Every gap purchase is affiliate revenue.

Determinism matters: same trip + same closet = same list (with a "shuffle
alternatives" affordance). The LLM decorates and explains; the optimizer
decides. This keeps costs low (~1–2 Claude calls per trip) and quality
consistent.

### Output

Packing list grouped by outfit-per-day and by suitcase category, each item
with photo + why; compression stats ("11 items → 14 outfits, fits carry-on");
gap list with shopping links; weather strip; culture briefing card.

### Effort

~6–8 engineer-weeks: capsule optimizer 2.5w, weather + trip model 1w,
culture KB schema + first 30 destinations 2w (content, parallelizable),
LLM orchestration 1w, packing UI 1.5w.

---

## Feature 3 — Outfit vision board

### User experience

- Auto-generated board per trip: day-by-day outfit cards using the cutout
  images (top + bottom + shoes + accessories composed on a clean canvas).
- **Mix & match:** drag items between outfits; tap an item → carousel of
  packed alternatives; engine live-validates swaps (weather/coverage warnings
  as gentle badges, never blockers).
- Moodboard mode: freeform canvas — resize, overlap, add color-palette chips
  and destination photos. This is the screenshot-and-share surface.
- Share: export as image / shareable link (public read-only page) — organic
  growth loop.

### Build notes

- React Native: `react-native-gesture-handler` + `reanimated` for drag;
  render board as a component tree, export via `react-native-view-shot`.
  Same code renders on web through Expo.
- Board state: `boards(id, trip_id, layout jsonb)` — positions, z-order,
  scale per element. Realtime co-editing deferred (Supabase Realtime makes it
  cheap to add later).

### Effort

~4–5 engineer-weeks: board rendering + gestures 2.5w, alternatives/validation
1w, export/share 1w.

---

## Cross-cutting

- **Privacy:** wardrobe photos are sensitive-adjacent; private-by-default
  storage with signed URLs, clear deletion, no training on user photos.
- **Offline:** packing list + board cached locally (you're at the airport).
- **Accessibility:** color guidance never relies on color alone (pattern +
  text labels).

**Core MVP total: ~14–19 engineer-weeks** (one strong full-stack dev + heavy
AI-assisted coding realistically compresses this to ~8–10 calendar weeks).
