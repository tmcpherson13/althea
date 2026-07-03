/**
 * Demo dataset: the Marrakech trip. Chosen because it exercises the
 * culture engine — the differentiator. Replaced by Supabase data in
 * Phase 1 wiring; shapes match the schema 1:1.
 */

import type { Garment, Trip } from './types';

export const wardrobe: Garment[] = [
  {
    id: 'linen-shirt',
    name: 'Ivory linen shirt',
    category: 'top',
    colors: ['#EFE7D8', '#E0D5BE'],
    fabric: 'Linen',
    breathability: 5,
    formality: 3,
    coverage: { shoulders: true, knees: false },
    meta: 'Linen · warm-weather',
  },
  {
    id: 'breton-tee',
    name: 'Breton stripe tee',
    category: 'top',
    colors: ['#F1EDE4', '#26313B'],
    fabric: 'Cotton',
    breathability: 4,
    formality: 2,
    coverage: { shoulders: true, knees: false },
    meta: 'Cotton · all-season',
  },
  {
    id: 'silk-cami',
    name: 'Black silk camisole',
    category: 'top',
    colors: ['#221F1E', '#3A3533'],
    fabric: 'Silk',
    breathability: 4,
    formality: 4,
    coverage: { shoulders: false, knees: false },
    meta: 'Silk · evening',
  },
  {
    id: 'olive-wide',
    name: 'Olive wide-leg trousers',
    category: 'bottom',
    colors: ['#5C6247', '#474D35'],
    fabric: 'Tencel',
    breathability: 4,
    formality: 3,
    coverage: { shoulders: false, knees: true },
    meta: 'Tencel · smart-casual',
  },
  {
    id: 'jeans',
    name: 'Straight jeans',
    category: 'bottom',
    colors: ['#5A7186', '#4E6377'],
    fabric: 'Denim',
    breathability: 2,
    formality: 2,
    coverage: { shoulders: false, knees: true },
    meta: 'Denim · casual',
  },
  {
    id: 'cream-midi',
    name: 'Cream midi skirt',
    category: 'bottom',
    colors: ['#F2EEE5', '#E5DFCE'],
    fabric: 'Cotton',
    breathability: 5,
    formality: 3,
    coverage: { shoulders: false, knees: true },
    meta: 'Cotton · modest length',
  },
  {
    id: 'saffron-maxi',
    name: 'Saffron maxi dress',
    category: 'dress',
    colors: ['#D9A441', '#B97F22'],
    fabric: 'Viscose',
    breathability: 4,
    formality: 4,
    coverage: { shoulders: false, knees: true },
    meta: 'Viscose · statement',
  },
  {
    id: 'slip-dress',
    name: 'Black slip dress',
    category: 'dress',
    colors: ['#2B2320', '#191412'],
    fabric: 'Silk',
    breathability: 4,
    formality: 5,
    coverage: { shoulders: false, knees: true },
    meta: 'Silk · evening',
  },
  {
    id: 'sand-overshirt',
    name: 'Sand overshirt',
    category: 'layer',
    colors: ['#D8C9A8', '#CFBF9B'],
    fabric: 'Cotton twill',
    breathability: 3,
    formality: 3,
    coverage: { shoulders: true, knees: false },
    meta: 'Cotton twill · layer',
  },
  {
    id: 'saffron-wrap',
    name: 'Saffron wrap scarf',
    category: 'layer',
    colors: ['#C99425', '#B3801B'],
    fabric: 'Modal',
    breathability: 5,
    formality: 3,
    coverage: { shoulders: true, knees: false },
    meta: 'Modal · coverage',
  },
  {
    id: 'sneakers',
    name: 'White leather sneakers',
    category: 'shoe',
    colors: ['#F4F1EA', '#DDD8CB'],
    fabric: 'Leather',
    breathability: 3,
    formality: 2,
    coverage: { shoulders: false, knees: false },
    meta: '18k-step rated',
  },
  {
    id: 'sandals',
    name: 'Tan flat sandals',
    category: 'shoe',
    colors: ['#B98A5E', '#96683F'],
    fabric: 'Leather',
    breathability: 5,
    formality: 3,
    coverage: { shoulders: false, knees: false },
    meta: 'Riad to dinner',
  },
  {
    id: 'woven-tote',
    name: 'Woven tote',
    category: 'accessory',
    colors: ['#C7B089', '#B89F74'],
    fabric: 'Raffia',
    breathability: 5,
    formality: 3,
    coverage: { shoulders: false, knees: false },
    meta: 'Fits under the seat',
  },
];

export const garmentById = (id: string): Garment => {
  const g = wardrobe.find((w) => w.id === id);
  if (!g) throw new Error(`Unknown garment: ${id}`);
  return g;
};

/** Which packed pieces can fill each lookbook slot (mix & match pool). */
export const slotAlternates: Record<string, string[]> = {
  top: ['linen-shirt', 'breton-tee', 'silk-cami'],
  bottom: ['olive-wide', 'cream-midi', 'jeans'],
  dress: ['saffron-maxi', 'slip-dress'],
  layer: ['sand-overshirt', 'saffron-wrap'],
  shoe: ['sneakers', 'sandals'],
  extra: ['woven-tote', 'saffron-wrap'],
};

type PackingLine = { garmentId: string; why: string; badge?: 'culture' | 'rewear' };

export const packingGroups: { title: string; lines: PackingLine[] }[] = [
  {
    title: 'Tops',
    lines: [
      {
        garmentId: 'linen-shirt',
        why: '27° afternoons — linen breathes; sleeves cover shoulders for the souks.',
        badge: 'culture',
      },
      {
        garmentId: 'breton-tee',
        why: 'Anchors 4 outfits; layers under the sand overshirt at night.',
        badge: 'rewear',
      },
      { garmentId: 'silk-cami', why: 'Riad dinners; always paired with the wrap when out.' },
    ],
  },
  {
    title: 'Bottoms & dresses',
    lines: [
      {
        garmentId: 'olive-wide',
        why: 'Cool, covered, souk-to-dinner. Your hardest-working item.',
        badge: 'rewear',
      },
      {
        garmentId: 'cream-midi',
        why: 'Below the knee — fine everywhere in the city.',
        badge: 'culture',
      },
      {
        garmentId: 'saffron-maxi',
        why: 'Photographs beautifully against the blue of Jardin Majorelle.',
      },
      { garmentId: 'slip-dress', why: 'Gueliz evenings only — pack the wrap for the taxi ride.' },
    ],
  },
  {
    title: 'Layers, shoes & extras',
    lines: [
      {
        garmentId: 'sand-overshirt',
        why: '16° nights and the Atlas morning — your only warm layer, goes with everything.',
      },
      {
        garmentId: 'saffron-wrap',
        why: "Shoulder cover, mosque visits, plane blanket. The trip's MVP.",
        badge: 'culture',
      },
      { garmentId: 'sneakers', why: "Souk cobbles — you'll walk 18k steps a day." },
      { garmentId: 'sandals', why: "Riad, pool, dinners. Heels won't survive the Medina." },
    ],
  },
];

export const packingGap = {
  name: 'Packable rain shell',
  why: 'Atlas day trip on Oct 15 — 40% shower risk at altitude and nothing in your closet fills the slot.',
  cta: 'Shop 3 options · from $49',
};

export const trip: Trip = {
  id: 'marrakech-oct',
  city: 'Marrakech',
  country: 'Morocco',
  startsOn: 'Oct 12',
  endsOn: 'Oct 19',
  nights: 7,
  companions: 'with Sarah',
  highTempC: 27,
  lowTempC: 16,
  activities: ['souks', 'riad dinners', 'Atlas day trip'],
  cultureBrief: {
    headline:
      'In the Medina and religious sites, shoulders and knees stay covered. Your saffron wrap works over 4 of these outfits — it is doing double duty.',
    details: [
      'Beachwear stays at the riad pool.',
      'Evenings in Gueliz are cosmopolitan — the slip dress is fine there.',
      'For the Atlas villages, trousers over the midi skirt.',
    ],
  },
  days: [
    {
      id: 'day-1',
      title: 'Day 1 — Souks & Medina',
      tempC: 27,
      isEvening: false,
      modestSite: true,
      slots: { top: 'linen-shirt', bottom: 'olive-wide', shoe: 'sneakers', extra: 'woven-tote' },
    },
    {
      id: 'day-3',
      title: 'Day 3 — Jardin Majorelle',
      tempC: 26,
      isEvening: false,
      modestSite: false,
      note: 'Photo day — saffron pops against Majorelle blue',
      slots: { dress: 'saffron-maxi', shoe: 'sandals', extra: 'saffron-wrap' },
    },
    {
      id: 'day-5',
      title: 'Day 5 — Riad dinner, Gueliz',
      tempC: 16,
      isEvening: true,
      modestSite: false,
      slots: { top: 'silk-cami', bottom: 'cream-midi', layer: 'sand-overshirt', shoe: 'sandals' },
    },
  ],
};

export const draftTrip = { city: 'Lisbon', country: 'Portugal', status: 'Draft · dates not set' };
