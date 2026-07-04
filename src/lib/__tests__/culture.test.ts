import { describe, expect, it } from 'vitest';

import { cultureFor, dayNeedsModesty } from '../culture';

describe('cultureFor', () => {
  it('returns the specific rule for a known country', () => {
    expect(cultureFor('MA').modestByDefault).toBe(true);
    expect(cultureFor('ma').headline).toMatch(/medina/i);
  });
  it('falls back to a permissive default for unknown countries', () => {
    const rule = cultureFor('NZ');
    expect(rule.modestByDefault).toBe(false);
    expect(rule.countryCode).toBe('NZ');
  });
});

describe('dayNeedsModesty', () => {
  it('is always true where the destination leans conservative', () => {
    expect(dayNeedsModesty(cultureFor('MA'), ['beach'])).toBe(true);
    expect(dayNeedsModesty(cultureFor('SA'), ['shopping'])).toBe(true);
  });
  it('is contextual in cosmopolitan places — true only for flagged activities', () => {
    const italy = cultureFor('IT');
    expect(dayNeedsModesty(italy, ['dinner', 'shopping'])).toBe(false);
    expect(dayNeedsModesty(italy, ['Vatican tour'])).toBe(true);
  });
  it('triggers on destination-specific contexts', () => {
    expect(dayNeedsModesty(cultureFor('KH'), ['Angkor sunrise'])).toBe(true);
    expect(dayNeedsModesty(cultureFor('MV'), ['resort beach'])).toBe(false);
    expect(dayNeedsModesty(cultureFor('MV'), ['local island visit'])).toBe(true);
  });
});

describe('coverage breadth', () => {
  it('covers the major modesty-sensitive destinations', () => {
    for (const cc of ['MA', 'AE', 'SA', 'QA', 'OM', 'EG', 'JO', 'IN', 'LK', 'KH', 'MM']) {
      expect(cultureFor(cc).countryCode).toBe(cc);
    }
  });
});
