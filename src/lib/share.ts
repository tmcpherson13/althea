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

export type JourneySummary = { places: string[]; photoCount: number };

export function journeyCaption(s: JourneySummary): { text: string; hashtags: string[] } {
  const places = s.places.filter(Boolean);
  const n = places.length;
  const first = places[0];
  const last = places[n - 1];
  const route = n > 1 && first && last && first !== last ? `${first} → ${last}` : first || 'my journey';
  const text = `${n} ${n === 1 ? 'place' : 'places'}. ${s.photoCount} ${s.photoCount === 1 ? 'moment' : 'moments'}. ${route}, captured with Althea ✦`;
  const hashtags = [
    '#Althea',
    '#TravelBeautifully',
    '#TravelJournal',
    ...places.slice(0, 3).map((p) => `#${slug(p.split(',')[0])}`).filter((t) => t.length > 1),
  ];
  return { text, hashtags };
}

export function journeyBlock(s: JourneySummary): string {
  const { text, hashtags } = journeyCaption(s);
  return `${text}\n\n${hashtags.join(' ')}`;
}
