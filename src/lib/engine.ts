/**
 * The packing engine's judgment layer, v0.
 *
 * Deterministic rules over garment attributes — the production system keeps
 * this deterministic core and adds a Claude pass for phrasing and color
 * harmony (see docs 02 in the scoping package). Pure TypeScript: no React,
 * no React Native imports, so it unit-tests without a simulator.
 */

import type { DayPlan, Garment, Verdict } from './types';

const HOT_DAY_C = 25;

/** Does the combined outfit cover shoulders and knees? */
export function outfitCoverage(items: Garment[]): { shoulders: boolean; knees: boolean } {
  return {
    shoulders: items.some((i) => i.coverage.shoulders),
    knees: items.some((i) => i.coverage.knees),
  };
}

/** Least-breathable non-layer piece drives the heat warning. */
function minBreathability(items: Garment[]): number {
  const core = items.filter((i) => i.category !== 'layer' && i.category !== 'accessory');
  if (core.length === 0) return 5;
  return Math.min(...core.map((i) => i.breathability));
}

/**
 * Validate an outfit against a day's context.
 * Rules are checked in priority order: culture first (highest stakes),
 * then climate. First failure wins; otherwise an affirmation.
 */
export function validateOutfit(items: Garment[], day: DayPlan): Verdict {
  if (day.modestSite) {
    const cover = outfitCoverage(items);
    if (!cover.shoulders) {
      return {
        level: 'warn',
        message: 'Shoulders bare — add a wrap or layer for this site',
      };
    }
    if (!cover.knees) {
      return {
        level: 'warn',
        message: 'Hem above the knee — swap for a longer piece here',
      };
    }
  }

  if (day.tempC >= HOT_DAY_C && minBreathability(items) <= 2) {
    return {
      level: 'warn',
      message: `Heavy fabric runs hot at ${day.tempC}° — a lighter weave would breathe better`,
    };
  }

  if (day.isEvening && day.tempC <= 18 && !items.some((i) => i.category === 'layer')) {
    return {
      level: 'warn',
      message: `${day.tempC}° this evening — bring a layer`,
    };
  }

  if (day.modestSite) {
    return { level: 'ok', message: `Culture-ready · breathable for ${day.tempC}°` };
  }
  if (day.isEvening) {
    return { level: 'ok', message: `${day.tempC}° evening — layer earns its place` };
  }
  return { level: 'ok', message: day.note ?? `Weather-right for ${day.tempC}°` };
}

/** items → outfit combinations, the capsule's headline number. */
export function capsuleStats(garments: Garment[]): {
  items: number;
  outfits: number;
} {
  const tops = garments.filter((g) => g.category === 'top').length;
  const bottoms = garments.filter((g) => g.category === 'bottom').length;
  const dresses = garments.filter((g) => g.category === 'dress').length;
  // Every top×bottom pairing plus each dress worn two ways (day / evening styling).
  const outfits = tops * bottoms + dresses * 2;
  return { items: garments.length, outfits };
}
