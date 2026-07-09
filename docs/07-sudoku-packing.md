# 07 · Sudoku Packing — Research & Implementation

You asked whether the "Sudoku packing" trend has techniques worth stealing.
It does — and they map cleanly onto the capsule generator. This doc records
the research and exactly how Althea's engine implements it.

## What it is

**Sudoku packing** (a.k.a. the 3×3×3 method) is a capsule built so that
**every top works with every bottom and every layer** — so any one-per-
category pick is a valid outfit, the way any row/column of a sudoku is valid.
The canonical form is **3 tops × 3 bottoms × 3 layers = 9 pieces → up to 27
outfits**. It went viral in 2025–26 (Natalie Shaquer trademarked "Packing
Sudoku"; Jean Wang popularized the 3×3 grid). Adjacent methods: the
**5-4-3-2-1** quantity method, the **rule of 3 / third-piece** styling rule,
capsule-wardrobe colour formulas, and Project 333.

**The load-bearing insight:** the "sudoku" is the *constraint* — full pairwise
compatibility — not just a grid layout. The trick that makes full
compatibility achievable is a **neutral-biased, capped colour palette with
neutral bottoms and a single statement layer**.

## Rules we encoded (→ where, in `althea/src/lib/capsule.ts`)

| # | Sudoku rule | Implementation |
|---|-------------|----------------|
| 1 | **Full pairwise compatibility** (every top ↔ every bottom ↔ every layer) | `compatible()` + `pickAxis()` rejects any item that fails to pair with *all* already-selected cross-category items; relaxes only to hit a floor on small/incoherent closets |
| 2 | **Neutral base + ≤1–2 accents** | `isNeutral()` (HSL: low saturation, or dark tones like navy/charcoal, or near-white); neutrals pair with anything |
| 3 | **Neutral bottoms** (highest-multiplier axis) | `coverageScore()` gives neutrals a bonus; **bottoms are seeded first** (Shaquer's order) |
| 4 | **Formality coherence** | `compatible()` requires formality within 2 steps |
| 5 | **Statement third piece** (the layer does ⅓ of the work) | layer axis selected against tops+bottoms; colour-variety de-dupe keeps a statement in the mix |
| 6 | **Single climate/occasion** assumption | `suitsWeather()` filters the pool to the trip's temperature band before selection |
| 7 | **No just-in-case items** | items with zero outfit coverage never get picked; `gapsFor()` surfaces missing essentials instead |
| 8 | **Two honest outfit counts** (don't oversell 27) | `capsuleStats()` returns both `combinatorialOutfits` (tops×bottoms×(1+layers)+dresses) and the lower `wearableLooks` (tops×bottoms+dresses). The UI headlines the honest number and frames the big one as "up to N combinations" |

**Ratios by trip length** (`targetsForNights`): ≤3 nights → 3/2/1; 4–7 →
3/3/2; 8+ → 5/4/3 (toward 5-4-3-2-1). Cold nights add a layer.

## Pitfalls the research flagged, and how we avoid them

- **"Samey" looks** (27 combos that differ only by a swapped layer) → we
  report `wearableLooks` (top×bottom pairings) as the headline, not the
  inflated product; colour-variety de-dupe avoids near-identical picks.
- **Uniform/boring capsule** → neutral base *plus* a required statement layer
  and accent, not all-neutral.
- **Forced/contextually-wrong combos** → formality-band pairing + the culture
  engine's per-day modesty checks (a mathematically valid outfit that bares
  shoulders at a mosque is flagged, not shown as fine).
- **Restrictiveness** → the Lookbook lets users swap any slot; the engine
  re-validates live.

## Where it shows up in the app

- **Packing screen:** stat card reads *items · looks · carry-on*; the Lookbook
  button says "up to N combinations."
- **Lookbook:** day outfits are one-per-category picks from the capsule; tap
  any piece to cycle alternates (the "read a different row of the sudoku"
  interaction), re-validated against weather + dress norms.

Sources (selection): AARP, Reader's Digest, Apartment Therapy, Yolo Journal,
likewhereyouregoing, curvysewingcollective, modernminimalism, thecapsulist —
full citation set in the research transcript.
