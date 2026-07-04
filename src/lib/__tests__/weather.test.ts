import { describe, expect, it } from 'vitest';

import {
  bandFromDaily,
  bandLabel,
  chooseSource,
  daysUntil,
  median,
  shiftToYear,
  wetDayChance,
} from '../weather';

describe('median', () => {
  it('averages the middle pair for even length', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it('takes the middle for odd length and ignores order', () => {
    expect(median([9, 1, 5])).toBe(5);
  });
  it('drops non-finite values, returns 0 when empty', () => {
    expect(median([Number.NaN, 10])).toBe(10);
    expect(median([])).toBe(0);
  });
});

describe('bandFromDaily', () => {
  it('rounds median highs/lows and precip', () => {
    const b = bandFromDaily([26, 27, 28], [15, 16, 17], [10, 8, 6]);
    expect(b).toEqual({ highC: 27, lowC: 16, precipChance: 8 });
  });
  it('defaults precip to 0 when absent', () => {
    expect(bandFromDaily([20], [10]).precipChance).toBe(0);
  });
});

describe('daysUntil', () => {
  it('counts whole days forward', () => {
    expect(daysUntil('2026-07-10', '2026-07-04')).toBe(6);
  });
  it('is negative for past dates', () => {
    expect(daysUntil('2026-07-01', '2026-07-04')).toBe(-3);
  });
});

describe('chooseSource', () => {
  it('uses forecast within the horizon', () => {
    expect(chooseSource(0)).toBe('forecast');
    expect(chooseSource(15)).toBe('forecast');
  });
  it('falls back to seasonal beyond the horizon or in the past', () => {
    expect(chooseSource(16)).toBe('seasonal');
    expect(chooseSource(-1)).toBe('seasonal');
  });
});

describe('shiftToYear', () => {
  it('keeps month/day, swaps the year', () => {
    expect(shiftToYear('2026-10-12', 2025)).toBe('2025-10-12');
  });
  it('clamps Feb 29 to Feb 28', () => {
    expect(shiftToYear('2028-02-29', 2025)).toBe('2025-02-28');
  });
});

describe('wetDayChance', () => {
  it('is the share of days with >=1mm rain', () => {
    expect(wetDayChance([0, 0.5, 2, 5])).toBe(50);
    expect(wetDayChance([])).toBe(0);
  });
});

describe('bandLabel', () => {
  it('renders a compact strip', () => {
    expect(bandLabel({ highC: 27, lowC: 16, precipChance: 8 })).toBe(
      '27° days · 16° nights · 8% rain'
    );
  });
});
