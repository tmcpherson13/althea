# 01 · Product Vision

## The one-liner

**The travel app that knows your closet.** Tell it where you're going; it tells
you exactly what to pack from clothes you already own — weather-right,
culturally respectful, fashionable, and ruthlessly efficient — and fills the
gaps with smart shopping links.

## Why women, specifically

Women's travel is underserved on exactly the dimensions this app targets:

- **Packing is a genuinely harder problem** — more outfit variety, more
  occasion-specific dress, more culture-norm exposure (head coverings,
  shoulder/knee coverage at religious sites, beach-to-dinner transitions).
- **Cultural dress norms carry real social and safety consequences** that
  generic packing apps ignore entirely.
- **Existing tools are split down the middle:** wardrobe apps (Stylebook,
  Whering, Indyx) know your clothes but nothing about travel; packing apps
  (PackPoint) know your trip but nothing about your clothes. Nobody joins the
  two.
- Women drive the substantial majority of travel-planning decisions and the
  overwhelming majority of wardrobe-app usage — the two audiences already
  overlap heavily.

## Product principles

1. **Simple to the point of obvious.** Three-step core loop: scan closet once →
   enter trip → get your packing board. Everything else is progressive
   disclosure.
2. **Polished and professional.** Editorial-quality visual design (the outfit
   board must feel like a fashion magazine spread, not a checklist app).
3. **Expert, not generic.** Every recommendation carries a *why*: "linen, not
   cotton — Marrakech averages 37°C in July", "cover shoulders for the
   Medina; this wrap works over 4 of your outfits."
4. **Own the trust.** Cultural-norm guidance is reviewed content, not raw LLM
   output — wrong advice here is a brand-killer.

## Monetization

Freemium SaaS, as requested:

| Tier | Price (working) | Contents |
|------|-----------------|----------|
| **Free** | $0, tasteful ads | 1 active trip, wardrobe up to ~50 items, standard packing engine, outfit board |
| **Plus** | ~$4.99/mo · $39.99/yr | Ad-free, unlimited trips + wardrobe, culture deep-dives, deal alerts, board sharing, priority AI |
| **Affiliate layer** (both tiers) | — | "You don't own it → buy it" links earn 3–15% commission (Amazon Associates, ShopStyle Collective, LTK, Skimlinks). This monetizes the free tier *beyond* ads and is native to the product, not bolted on. |

Notes (calibrated against research, doc 05):

- **Ads are a funnel, not a business** — even Duolingo earns only ~6–8% of
  revenue from ads, and both the wardrobe and trip-planner categories are
  effectively ad-free. Ads stay native-only, on content/deals surfaces,
  never in the wardrobe/packing/board flow; "ad-free" is one line inside the
  Plus bundle, not the headline. The affiliate layer (LTK-tier fashion rates
  run 13–20%; Booking.com ~4% of stay) likely out-earns ads at every stage.
- Pricing anchors: wardrobe apps span free (Whering, Alta — both
  affiliate-funded) to $7.99/mo (Cladwell, called overpriced); trip planners
  converge at $40–60/yr (Wanderlog ~$40, TripIt $49). $39.99/yr sits at the
  travel-annual median. **The paid tier must sell travel expertise, not
  styling alone** — free AI stylists (Alta) set the styling price floor at $0.
- Conversion planning: ~2% download-to-paid median for freemium (4–6% is
  top-quartile); travel trial-to-paid is elite (~43% median) and ~28% of
  travel conversions land after week 6 — trigger the paywall at trip
  creation and judge it on long windows. Push annual (travel skews 59–66%
  annual).
- Subscription infra via RevenueCat (App Store + Play + Stripe web billing
  in one SDK). **Clean cancellation is a feature:** billing dark patterns
  dominate the category's worst reviews.

## What "world's leading travel expert" means in-product

The packing engine is the wedge, but the expert persona extends across:

- **Destination intelligence:** curated guides with a woman-traveler lens
  (safety notes by neighborhood/time-of-day, dress norms, solo-friendly
  venues), AI-assembled and editorially reviewed.
- **Deals & hacks:** fare-drop alerts for saved routes, shoulder-season
  suggestions, "carry-on only" coaching tied to the packing engine.
- **Planning:** lightweight itinerary (day cards), not a Wanderlog clone —
  we integrate with calendars/maps rather than rebuilding them.

## Success metrics (MVP)

- Activation: % of new users who scan ≥10 wardrobe items in week 1 (target 40%).
- Magic moment: % of trips where the user accepts ≥70% of the suggested
  packing list (target 60%).
- Retention: 4-week retention ≥25%; trips created per user per quarter ≥1.3.
- Revenue: free→paid conversion ≥3% at 6 months; affiliate EPC tracked from day one.
