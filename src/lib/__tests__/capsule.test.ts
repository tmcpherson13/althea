import { describe, expect, it } from 'vitest';

import {
  capsuleStats,
  colorsCompatible,
  compatible,
  generatePlan,
  isNeutral,
  selectCapsule,
  suitsWeather,
  targetsForNights,
  validateOutfit,
  type TripInput,
} from '../capsule';
import { wardrobe } from '../mock';
import type { Garment } from '../types';

const g = (over: Partial<Garment>): Garment => ({
  id: 'x',
  name: 'x',
  category: 'top',
  colors: ['#888888', '#777777'],
  fabric: '',
  breathability: 3,
  formality: 3,
  coverage: { shoulders: false, knees: false },
  meta: '',
  ...over,
});

describe('isNeutral', () => {
  it('treats black/white/grey/navy as neutral', () => {
    expect(isNeutral('#000000')).toBe(true);
    expect(isNeutral('#FFFFFF')).toBe(true);
    expect(isNeutral('#808080')).toBe(true);
    expect(isNeutral('#1B2A4A')).toBe(true); // navy (dark)
  });
  it('treats a saturated accent as non-neutral', () => {
    expect(isNeutral('#D9A441')).toBe(false); // saffron
    expect(isNeutral('#B96F6F')).toBe(false); // rose
  });
});

describe('colorsCompatible', () => {
  it('a neutral pairs with any accent', () => {
    expect(colorsCompatible(g({ colors: ['#111111', '#000'] }), g({ colors: ['#D9A441', '#000'] }))).toBe(true);
  });
  it('two distant accents do not pair', () => {
    // saffron (~45°) vs teal (~180°) → ~135° apart, not analogous nor complementary
    expect(colorsCompatible(g({ colors: ['#D9A441', '#000'] }), g({ colors: ['#1FA6A6', '#000'] }))).toBe(false);
  });
});

describe('suitsWeather', () => {
  it('excludes heavy non-layers when hot', () => {
    expect(suitsWeather(g({ category: 'bottom', breathability: 2 }), 30)).toBe(false);
  });
  it('always keeps layers', () => {
    expect(suitsWeather(g({ category: 'layer', breathability: 1 }), 32)).toBe(true);
  });
});

describe('compatible', () => {
  it('rejects a large formality gap', () => {
    expect(compatible(g({ formality: 1 }), g({ formality: 5 }))).toBe(false);
    expect(compatible(g({ formality: 2 }), g({ formality: 4 }))).toBe(true);
  });
});

describe('targetsForNights', () => {
  it('scales with trip length and adds a layer for cold nights', () => {
    expect(targetsForNights(2, 20).bottoms).toBe(2);
    expect(targetsForNights(10, 20).tops).toBe(5);
    expect(targetsForNights(5, 8).layers).toBe(targetsForNights(5, 20).layers + 1);
  });
});

describe('selectCapsule — the Sudoku property', () => {
  const capsule = selectCapsule(wardrobe, 27, 16, 7);

  it('produces a non-empty capsule from a coherent wardrobe', () => {
    expect(capsule.tops.length).toBeGreaterThanOrEqual(2);
    expect(capsule.bottoms.length).toBeGreaterThanOrEqual(1);
    expect(capsule.layers.length).toBeGreaterThanOrEqual(1);
  });

  it('every top pairs with every bottom AND every layer (full pairwise)', () => {
    for (const top of capsule.tops) {
      for (const bottom of capsule.bottoms) expect(compatible(top, bottom)).toBe(true);
      for (const layer of capsule.layers) expect(compatible(top, layer)).toBe(true);
    }
  });

  it('excludes heavy bottoms in hot weather', () => {
    // Mock jeans (breathability 2) must not survive a 27° selection.
    expect(capsule.bottoms.some((b) => b.id === 'jeans')).toBe(false);
  });
});

describe('capsuleStats — honest counts', () => {
  it('reports combinatorial max and a lower wearable count', () => {
    const capsule = selectCapsule(wardrobe, 27, 16, 7);
    const s = capsuleStats(capsule);
    const tb = capsule.tops.length * capsule.bottoms.length;
    expect(s.combinatorialOutfits).toBe(tb * (1 + capsule.layers.length) + capsule.dresses.length);
    expect(s.wearableLooks).toBe(tb + capsule.dresses.length);
    expect(s.wearableLooks).toBeLessThanOrEqual(s.combinatorialOutfits);
  });
});

describe('generatePlan', () => {
  const input: TripInput = {
    city: 'Marrakech',
    country: 'Morocco',
    countryCode: 'MA',
    startsOn: '2026-10-12',
    endsOn: '2026-10-19',
    nights: 7,
    companions: 'with Sarah',
    highTempC: 27,
    lowTempC: 16,
    activities: ['souks', 'dinners'],
  };
  const plan = generatePlan(wardrobe, input);

  it('assembles a renderable plan', () => {
    expect(plan.groups.length).toBeGreaterThan(0);
    expect(plan.trip.days.length).toBeGreaterThanOrEqual(3);
    expect(plan.trip.cultureBrief.headline).toMatch(/medina|cover/i);
    expect(Object.keys(plan.garments).length).toBe(plan.stats.items);
  });

  it('every day outfit is coverage-valid for a modest destination', () => {
    for (const day of plan.trip.days) {
      const items = Object.values(day.slots)
        .map((id) => plan.garments[id!])
        .filter(Boolean);
      expect(validateOutfit(items, day).level, day.title).toBe('ok');
    }
  });

  it('every slot alternate resolves to a real garment', () => {
    for (const ids of Object.values(plan.slotAlternates)) {
      for (const id of ids ?? []) expect(plan.garments[id]).toBeDefined();
    }
  });
});
