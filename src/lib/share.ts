/**
 * Share-asset text. Pure functions (unit-tested) that turn a plan into a
 * caption + hashtags for the outfit-board share card. The image capture and
 * share sheet live in the share screen; this is just the words.
 *
 * The numbers echo the Sudoku method's honest framing: lead with wearable
 * looks, not the inflated combinatorial count.
 */

import type { Plan } from './types';

const slug = (s: string) => s.replace(/[^A-Za-z0-9]/g, '');

export function shareCaption(plan: Plan): { text: string; hashtags: string[] } {
  const { trip, stats } = plan;
  const fit = stats.carryOnFit ? ' One carry-on.' : '';
  const text = `${stats.items} pieces. ${stats.wearableLooks} looks.${fit} Packed for ${trip.city} with Althea ✦`;
  const hashtags = [
    '#Althea',
    '#TravelBeautifully',
    '#PackingSudoku',
    '#CapsuleWardrobe',
    ...(trip.city ? [`#${slug(trip.city)}`] : []),
    ...(trip.country ? [`#${slug(trip.country)}`] : []),
  ];
  return { text, hashtags };
}

/** Full caption block (text + hashtags) ready to paste. */
export function shareBlock(plan: Plan): string {
  const { text, hashtags } = shareCaption(plan);
  return `${text}\n\n${hashtags.join(' ')}`;
}
