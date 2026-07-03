import { describe, expect, it } from 'vitest';

import { capsuleStats, outfitCoverage, validateOutfit } from '../engine';
import { garmentById, trip, wardrobe } from '../mock';
import type { DayPlan } from '../types';

const medinaDay: DayPlan = {
  id: 'test-medina',
  title: 'Medina',
  tempC: 27,
  isEvening: false,
  modestSite: true,
  slots: {},
};

const coolEvening: DayPlan = {
  id: 'test-evening',
  title: 'Riad dinner',
  tempC: 16,
  isEvening: true,
  modestSite: false,
  slots: {},
};

describe('validateOutfit — culture rules come first', () => {
  it('flags bare shoulders at a modest site', () => {
    const outfit = [garmentById('silk-cami'), garmentById('olive-wide'), garmentById('sandals')];
    const verdict = validateOutfit(outfit, medinaDay);
    expect(verdict.level).toBe('warn');
    expect(verdict.message).toMatch(/shoulders/i);
  });

  it('accepts the same outfit once a wrap covers the shoulders', () => {
    const outfit = [
      garmentById('silk-cami'),
      garmentById('olive-wide'),
      garmentById('sandals'),
      garmentById('saffron-wrap'),
    ];
    expect(validateOutfit(outfit, medinaDay).level).toBe('ok');
  });

  it('flags an above-the-knee gap at a modest site', () => {
    const outfit = [garmentById('linen-shirt'), garmentById('sneakers')];
    const verdict = validateOutfit(outfit, medinaDay);
    expect(verdict.level).toBe('warn');
    expect(verdict.message).toMatch(/knee/i);
  });
});

describe('validateOutfit — climate rules', () => {
  it('warns on heavy fabric in the heat', () => {
    const outfit = [garmentById('breton-tee'), garmentById('jeans'), garmentById('sneakers')];
    const verdict = validateOutfit(outfit, { ...medinaDay, modestSite: false });
    expect(verdict.level).toBe('warn');
    expect(verdict.message).toMatch(/hot|heat|weave/i);
  });

  it('asks for a layer on a cool evening', () => {
    const outfit = [garmentById('silk-cami'), garmentById('cream-midi'), garmentById('sandals')];
    const verdict = validateOutfit(outfit, coolEvening);
    expect(verdict.level).toBe('warn');
    expect(verdict.message).toMatch(/layer/i);
  });

  it('approves a layered cool-evening outfit', () => {
    const outfit = [
      garmentById('silk-cami'),
      garmentById('cream-midi'),
      garmentById('sand-overshirt'),
      garmentById('sandals'),
    ];
    expect(validateOutfit(outfit, coolEvening).level).toBe('ok');
  });
});

describe('trip dataset ships valid', () => {
  it('every planned day in the demo trip validates ok', () => {
    for (const day of trip.days) {
      const items = Object.values(day.slots).map((id) => garmentById(id!));
      expect(validateOutfit(items, day).level, day.title).toBe('ok');
    }
  });
});

describe('capsuleStats', () => {
  it('computes tops×bottoms + dresses×2', () => {
    const packed = wardrobe.filter((g) => g.category !== 'accessory');
    const stats = capsuleStats(packed);
    expect(stats.items).toBe(12);
    expect(stats.outfits).toBe(13); // 3 tops × 3 bottoms + 2 dresses × 2
  });
});

describe('outfitCoverage', () => {
  it('any covering piece counts for the whole outfit', () => {
    const coverage = outfitCoverage([garmentById('silk-cami'), garmentById('saffron-wrap')]);
    expect(coverage.shoulders).toBe(true);
  });
});
