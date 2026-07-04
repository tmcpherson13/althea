import { describe, expect, it } from 'vitest';

import { journeyCaption, shareBlock, shareCaption } from '../share';
import { demoPlan } from '../mock';

describe('shareCaption', () => {
  const { text, hashtags } = shareCaption(demoPlan);

  it('leads with the honest wearable-looks count, not the inflated one', () => {
    expect(text).toContain(`${demoPlan.stats.wearableLooks} looks`);
    expect(text).toContain(`${demoPlan.stats.items} pieces`);
    expect(text).not.toContain(String(demoPlan.stats.combinatorialOutfits));
  });

  it('names the destination and brand', () => {
    expect(text).toContain(demoPlan.trip.city);
    expect(text).toContain('Althea');
  });

  it('includes brand + destination hashtags with no spaces', () => {
    expect(hashtags).toContain('#Althea');
    expect(hashtags).toContain('#PackingSudoku');
    expect(hashtags).toContain('#Marrakech');
    for (const tag of hashtags) expect(tag).not.toMatch(/\s/);
  });
});

describe('shareBlock', () => {
  it('joins caption and hashtags into a paste-ready block', () => {
    const block = shareBlock(demoPlan);
    expect(block).toContain('\n\n');
    expect(block.endsWith(shareCaption(demoPlan).hashtags.join(' '))).toBe(true);
  });
});

describe('journeyCaption', () => {
  it('renders a route and pluralizes correctly', () => {
    const { text } = journeyCaption({ places: ['Marrakech', 'Lisbon', 'Amalfi'], photoCount: 12 });
    expect(text).toContain('3 places');
    expect(text).toContain('12 moments');
    expect(text).toContain('Marrakech → Amalfi');
  });
  it('handles a single place and single moment', () => {
    const { text } = journeyCaption({ places: ['Kyoto'], photoCount: 1 });
    expect(text).toContain('1 place.');
    expect(text).toContain('1 moment.');
    expect(text).toContain('Kyoto');
  });
  it('adds destination hashtags without spaces', () => {
    const { hashtags } = journeyCaption({ places: ['San Sebastián'], photoCount: 3 });
    expect(hashtags).toContain('#TravelJournal');
    for (const tag of hashtags) expect(tag).not.toMatch(/\s/);
  });
});
