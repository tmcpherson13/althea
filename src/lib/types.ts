/** Core domain types — mirrors the Supabase schema (supabase/migrations). */

export type GarmentCategory =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'layer'
  | 'shoe'
  | 'accessory';

export type Coverage = {
  shoulders: boolean;
  knees: boolean;
};

export type Garment = {
  id: string;
  name: string;
  category: GarmentCategory;
  /** dominant + secondary swatch colors, hex */
  colors: [string, string];
  fabric: string;
  /** 1 (cold-weather) … 5 (hot-weather friendly) */
  breathability: 1 | 2 | 3 | 4 | 5;
  /** 1 (very casual) … 5 (formal) */
  formality: 1 | 2 | 3 | 4 | 5;
  coverage: Coverage;
  meta: string;
};

export type OutfitSlot = 'top' | 'bottom' | 'dress' | 'layer' | 'shoe' | 'extra';

export type DayPlan = {
  id: string;
  title: string;
  tempC: number;
  isEvening: boolean;
  /** site requires covered shoulders/knees (e.g. Medina, religious sites) */
  modestSite: boolean;
  note?: string;
  slots: Partial<Record<OutfitSlot, string>>; // garment ids
};

export type Trip = {
  id: string;
  city: string;
  country: string;
  startsOn: string;
  endsOn: string;
  nights: number;
  companions?: string;
  highTempC: number;
  lowTempC: number;
  activities: string[];
  cultureBrief: { headline: string; details: string[] };
  days: DayPlan[];
};

export type Verdict = { level: 'ok' | 'warn'; message: string };

// ---------- packing plan (what the Packing/Lookbook screens render) ----------

export type PackingLine = { garmentId: string; why: string; badge?: 'culture' | 'rewear' };

export type PackingGroup = { title: string; lines: PackingLine[] };

export type Gap = { name: string; why: string; cta: string };

export type CapsuleStats = {
  items: number;
  /** Sudoku combinatorial maximum: tops×bottoms×(1+layers) + dresses. */
  combinatorialOutfits: number;
  /** Honest wearable looks: distinct top×bottom pairings + dresses. */
  wearableLooks: number;
  carryOnFit: boolean;
};

/**
 * A complete, renderable plan. Both the demo (mock) and the live Sudoku
 * generator produce this shape, so the screens have a single code path.
 * `garments` is the id→garment lookup scoped to this plan's capsule.
 */
export type Plan = {
  trip: Trip;
  garments: Record<string, Garment>;
  groups: PackingGroup[];
  gaps: Gap[];
  /** Per-slot alternatives (capsule item ids) for the Lookbook mix & match. */
  slotAlternates: Partial<Record<OutfitSlot, string[]>>;
  stats: CapsuleStats;
};
