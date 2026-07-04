/**
 * The Sudoku packing generator.
 *
 * "Sudoku packing" (a.k.a. the 3×3×3 method) builds a capsule where **every
 * top works with every bottom and every layer** — so any one-per-category pick
 * is a valid outfit, the way any row/column of a sudoku is valid. The trick
 * that makes full pairwise compatibility achievable is a neutral-biased,
 * capped colour palette with neutral bottoms and a single statement layer.
 *
 * This module encodes that as a deterministic selector over the user's real
 * wardrobe (research synthesis in docs/travel-app). Pure TypeScript — no React,
 * no network — so it unit-tests in Node.
 *
 * Design choices (from the method):
 *  - Bottoms-first, neutral-biased seeding (Rule 4).
 *  - Full pairwise compatibility as a hard filter, relaxed only to hit a floor
 *    when a small/incoherent wardrobe can't satisfy it (Rule 1).
 *  - A mandatory statement layer + accent to avoid the "uniform" pitfall (Rule 7).
 *  - Two honest outfit counts, never the inflated single number (Outfit math).
 */

import { validateOutfit } from './engine';
import type {
  CapsuleStats,
  DayPlan,
  Gap,
  Garment,
  GarmentCategory,
  PackingGroup,
  Plan,
  Trip,
} from './types';
import { cultureFor, dayNeedsModesty, type CultureRule } from './culture';

// ---------- colour model ----------

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { h: 0, s: 0, l: 0.5 };
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s, l };
}

/** Neutrals (black, white, grey, navy, beige, tan) anchor the palette.
 *  Dark tones count too: navy/charcoal/deep brown read as neutral in dress
 *  even though HSL saturation is high, so low lightness qualifies. */
export function isNeutral(hex: string): boolean {
  const { s, l } = hexToHsl(hex);
  return s <= 0.22 || l <= 0.2 || l >= 0.92;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Two garments' dominant colours coexist: a neutral pairs with anything;
 *  two accents pair only if analogous or roughly complementary. */
export function colorsCompatible(a: Garment, b: Garment): boolean {
  if (isNeutral(a.colors[0]) || isNeutral(b.colors[0])) return true;
  const d = hueDistance(hexToHsl(a.colors[0]).h, hexToHsl(b.colors[0]).h);
  return d <= 45 || (d >= 150 && d <= 210);
}

// ---------- weather / compatibility ----------

const HOT = 26;

/** Layers are always eligible (cool nights); non-layers must breathe when hot. */
export function suitsWeather(g: Garment, highC: number): boolean {
  if (g.category === 'layer' || g.category === 'accessory') return true;
  if (highC >= HOT && g.breathability <= 2) return false;
  return true;
}

/** The sudoku pairing test: colour-compatible and within two formality steps. */
export function compatible(a: Garment, b: Garment): boolean {
  return colorsCompatible(a, b) && Math.abs(a.formality - b.formality) <= 2;
}

// ---------- selection ----------

type Targets = { tops: number; bottoms: number; layers: number; dresses: number; shoes: number };

export function targetsForNights(nights: number, lowC: number): Targets {
  let t: Targets;
  if (nights <= 3) t = { tops: 3, bottoms: 2, layers: 1, dresses: 1, shoes: 2 };
  else if (nights <= 7) t = { tops: 3, bottoms: 3, layers: 2, dresses: 2, shoes: 2 };
  else t = { tops: 5, bottoms: 4, layers: 3, dresses: 2, shoes: 3 };
  if (lowC <= 12) t.layers += 1; // cold nights need more coverage
  return t;
}

const byCategory = (w: Garment[], c: GarmentCategory) => w.filter((g) => g.category === c);

/** Coverage score against a reference pool + neutral bonus (Rule 4). */
function coverageScore(g: Garment, pool: Garment[]): number {
  const cov = pool.reduce((n, r) => n + (compatible(g, r) ? 1 : 0), 0);
  return cov + (isNeutral(g.colors[0]) ? 2 : 0);
}

/**
 * Greedily pick up to `target` items that are compatible with every item in
 * each `mustPairAll` group (the sudoku constraint). If fewer than `floor`
 * qualify, relax the constraint so a small wardrobe still yields a capsule.
 */
function pickAxis(
  candidates: Garment[],
  refPool: Garment[],
  mustPairAll: Garment[][],
  target: number,
  floor: number
): Garment[] {
  const pairsAll = (g: Garment) =>
    mustPairAll.every((group) => group.every((sel) => compatible(g, sel)));

  const ranked = [...candidates].sort((a, b) => coverageScore(b, refPool) - coverageScore(a, refPool));

  const strict = ranked.filter(pairsAll);
  const chosen = strict.slice(0, target);
  if (chosen.length >= floor) return dedupeColors(chosen, target);

  // Relax: backfill from the best remaining candidates to reach the floor.
  for (const g of ranked) {
    if (chosen.length >= Math.max(floor, target)) break;
    if (!chosen.includes(g)) chosen.push(g);
  }
  return chosen.slice(0, target);
}

/** Prefer colour variety among same-category picks to avoid a uniform capsule. */
function dedupeColors(items: Garment[], target: number): Garment[] {
  const out: Garment[] = [];
  const seenHue = new Set<number>();
  for (const g of items) {
    const bucket = Math.round(hexToHsl(g.colors[0]).h / 30);
    if (!seenHue.has(bucket) || out.length < 1) {
      out.push(g);
      seenHue.add(bucket);
    }
    if (out.length >= target) break;
  }
  // Top up if variety filtering left us short.
  for (const g of items) {
    if (out.length >= target) break;
    if (!out.includes(g)) out.push(g);
  }
  return out.slice(0, target);
}

export type Capsule = {
  tops: Garment[];
  bottoms: Garment[];
  layers: Garment[];
  dresses: Garment[];
  shoes: Garment[];
  accessories: Garment[];
};

/** Select a Sudoku capsule from a wardrobe for a weather band. */
export function selectCapsule(
  wardrobe: Garment[],
  highC: number,
  lowC: number,
  nights: number
): Capsule {
  const t = targetsForNights(nights, lowC);
  const pool = wardrobe.filter((g) => suitsWeather(g, highC));

  const topsPool = byCategory(pool, 'top');
  const bottomsPool = byCategory(pool, 'bottom');
  const layersPool = byCategory(pool, 'layer');

  // Bottoms first, biased neutral, scored against the tops they must serve.
  const bottoms = pickAxis(bottomsPool, topsPool, [], t.bottoms, Math.min(1, bottomsPool.length));
  // Layers must pair with every chosen bottom; ensure a statement piece if any.
  const layers = pickAxis(layersPool, [...topsPool, ...bottoms], [bottoms], t.layers, 0);
  // Tops must pair with every chosen bottom AND every chosen layer.
  const tops = pickAxis(topsPool, [...bottoms, ...layers], [bottoms, layers], t.tops, Math.min(2, topsPool.length));

  const dresses = byCategory(pool, 'dress').slice(0, t.dresses);
  const shoes = [...byCategory(pool, 'shoe')]
    .sort((a, b) => coverageScore(b, [...tops, ...bottoms]) - coverageScore(a, [...tops, ...bottoms]))
    .slice(0, t.shoes);
  const accessories = byCategory(pool, 'accessory').slice(0, 2);

  return { tops, bottoms, layers, dresses, shoes, accessories };
}

// ---------- outfit math ----------

export function capsuleStats(c: Capsule): CapsuleStats {
  const items =
    c.tops.length +
    c.bottoms.length +
    c.layers.length +
    c.dresses.length +
    c.shoes.length +
    c.accessories.length;
  const tb = c.tops.length * c.bottoms.length;
  return {
    items,
    // top×bottom worn alone, plus each layered over the top×bottom base.
    combinatorialOutfits: tb * (1 + c.layers.length) + c.dresses.length,
    // honest wearable looks: a swapped layer is a variant, not a new outfit.
    wearableLooks: tb + c.dresses.length,
    carryOnFit: items <= 14,
  };
}

// ---------- "why" strings + grouping ----------

function whyFor(g: Garment, highC: number, culture: CultureRule, capsule: Capsule): string {
  if (g.coverage.shoulders || g.coverage.knees) {
    if (culture.modestByDefault) return `Covered — respectful for ${culture.countryCode || 'local'} sites.`;
  }
  if (isNeutral(g.colors[0]) && g.category === 'bottom') {
    return `Neutral — pairs with all ${capsule.tops.length} tops.`;
  }
  if (g.category === 'layer') return 'Third piece — turns any top + bottom into a fresh look.';
  if (highC >= HOT && g.breathability >= 4) return `Breathes for ${highC}° afternoons.`;
  if (g.category === 'dress') return 'One-piece outfit — no pairing needed.';
  return g.meta || 'Earns its place in the capsule.';
}

function reWears(g: Garment, c: Capsule): number {
  if (g.category === 'top') return c.bottoms.length * (1 + c.layers.length);
  if (g.category === 'bottom') return c.tops.length * (1 + c.layers.length);
  if (g.category === 'layer') return c.tops.length * c.bottoms.length;
  return 0;
}

function groupsFor(c: Capsule, highC: number, culture: CultureRule): PackingGroup[] {
  const line = (g: Garment) => {
    const covers = g.coverage.shoulders || g.coverage.knees;
    const rw = reWears(g, c);
    return {
      garmentId: g.id,
      why: whyFor(g, highC, culture, c),
      badge:
        covers && culture.modestByDefault
          ? ('culture' as const)
          : rw >= 6
            ? ('rewear' as const)
            : undefined,
    };
  };
  return [
    { title: 'Tops', lines: c.tops.map(line) },
    { title: 'Bottoms & dresses', lines: [...c.bottoms, ...c.dresses].map(line) },
    {
      title: 'Layers, shoes & extras',
      lines: [...c.layers, ...c.shoes, ...c.accessories].map(line),
    },
  ].filter((grp) => grp.lines.length > 0);
}

// ---------- gaps ----------

function gapsFor(c: Capsule, highC: number, lowC: number, culture: CultureRule): Gap[] {
  const gaps: Gap[] = [];
  if (c.bottoms.length === 0)
    gaps.push({ name: 'A versatile bottom', why: 'Your capsule has no bottom to pair tops with.', cta: 'Shop bottoms' });
  if (lowC <= 12 && c.layers.length === 0)
    gaps.push({ name: 'A warm layer', why: `Nights drop to ${lowC}° and nothing in your closet layers.`, cta: 'Shop layers · from $59' });
  if (c.shoes.length === 0)
    gaps.push({ name: 'Comfortable walking shoes', why: "You'll be on your feet — and there's no shoe in the capsule.", cta: 'Shop shoes' });
  if (culture.modestByDefault && !c.tops.some((t) => t.coverage.shoulders) && !c.layers.some((l) => l.coverage.shoulders))
    gaps.push({ name: 'A shoulder-covering wrap', why: `${culture.headline}`, cta: 'Shop wraps · from $39' });
  return gaps;
}

// ---------- day plans ----------

function buildDays(
  c: Capsule,
  trip: { nights: number; highC: number; lowC: number; activities: string[] },
  culture: CultureRule,
  garments: Record<string, Garment>
): DayPlan[] {
  const dayCount = Math.min(Math.max(trip.nights, 3), 6);
  const days: DayPlan[] = [];
  const coveringLayer = c.layers.find((l) => l.coverage.shoulders);

  for (let i = 0; i < dayCount; i++) {
    const evening = i % 3 === 2; // roughly every third day is a dinner
    const tempC = evening ? trip.lowC + 2 : trip.highC;
    const modest = dayNeedsModesty(culture, trip.activities);

    const slots: DayPlan['slots'] = {};
    if (c.tops.length) slots.top = c.tops[i % c.tops.length].id;
    if (c.bottoms.length) slots.bottom = c.bottoms[i % c.bottoms.length].id;
    if (c.shoes.length) slots.shoe = c.shoes[i % c.shoes.length].id;

    // Add a layer for cool evenings or cold days.
    if (c.layers.length && (evening || trip.lowC <= 14)) {
      slots.layer = c.layers[i % c.layers.length].id;
    }
    // For modest days, make sure a covering piece is present.
    if (modest && coveringLayer) {
      const top = slots.top ? garments[slots.top] : undefined;
      const bottom = slots.bottom ? garments[slots.bottom] : undefined;
      const covered =
        (top?.coverage.shoulders ?? false) || (slots.layer && garments[slots.layer]?.coverage.shoulders);
      if (!covered) slots.layer = coveringLayer.id;
      if (bottom && !bottom.coverage.knees) {
        const modestBottom = c.bottoms.find((b) => b.coverage.knees);
        if (modestBottom) slots.bottom = modestBottom.id;
      }
    }
    if (c.accessories.length) slots.extra = c.accessories[i % c.accessories.length].id;

    days.push({
      id: `day-${i + 1}`,
      title: evening ? `Day ${i + 1} — evening out` : `Day ${i + 1} — exploring`,
      tempC,
      isEvening: evening,
      modestSite: modest,
      slots,
    });
  }
  return days;
}

// ---------- assemble ----------

export type TripInput = {
  city: string;
  country: string;
  countryCode: string;
  startsOn: string;
  endsOn: string;
  nights: number;
  companions?: string;
  highTempC: number;
  lowTempC: number;
  activities: string[];
};

/** Build a complete, renderable Plan from a wardrobe and trip. */
export function generatePlan(wardrobe: Garment[], input: TripInput): Plan {
  const culture = cultureFor(input.countryCode);
  const capsule = selectCapsule(wardrobe, input.highTempC, input.lowTempC, input.nights);

  const all = [
    ...capsule.tops,
    ...capsule.bottoms,
    ...capsule.layers,
    ...capsule.dresses,
    ...capsule.shoes,
    ...capsule.accessories,
  ];
  const garments: Record<string, Garment> = Object.fromEntries(all.map((g) => [g.id, g]));

  const days = buildDays(
    capsule,
    { nights: input.nights, highC: input.highTempC, lowC: input.lowTempC, activities: input.activities },
    culture,
    garments
  );

  const trip: Trip = {
    id: `${input.countryCode}-${input.startsOn}`,
    city: input.city,
    country: input.country,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    nights: input.nights,
    companions: input.companions,
    highTempC: input.highTempC,
    lowTempC: input.lowTempC,
    activities: input.activities,
    cultureBrief: { headline: culture.headline, details: culture.details },
    days,
  };

  const slotAlternates: Plan['slotAlternates'] = {
    top: capsule.tops.map((g) => g.id),
    bottom: capsule.bottoms.map((g) => g.id),
    dress: capsule.dresses.map((g) => g.id),
    layer: capsule.layers.map((g) => g.id),
    shoe: capsule.shoes.map((g) => g.id),
    extra: [...capsule.accessories, ...capsule.layers].map((g) => g.id),
  };

  return {
    trip,
    garments,
    groups: groupsFor(capsule, input.highTempC, culture),
    gaps: gapsFor(capsule, input.highTempC, input.lowTempC, culture),
    slotAlternates,
    stats: capsuleStats(capsule),
  };
}

/** Re-export so callers can validate assembled day outfits. */
export { validateOutfit };
