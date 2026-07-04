import { describe, expect, it } from 'vitest';

import { shareBlock, shareCaption } from '../share';
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
