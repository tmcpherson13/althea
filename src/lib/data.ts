/**
 * Live-or-mock data layer. Hooks read from Supabase when the app is live and
 * the user is signed in; otherwise they return the demo dataset instantly.
 * Screens consume these hooks and never branch on `isLive` themselves.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { generatePlan, type TripInput } from '@/lib/capsule';
import { demoPlan, wardrobe as mockWardrobe } from '@/lib/mock';
import { isLive, supabase } from '@/lib/supabase';
import type { Garment, GarmentCategory, Plan } from '@/lib/types';
import { daysUntil, geocode, weatherForTrip } from '@/lib/weather';

const clampRating = (n: unknown): 1 | 2 | 3 | 4 | 5 => {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 3;
  return Math.min(5, Math.max(1, v)) as 1 | 2 | 3 | 4 | 5;
};

/** Map a wardrobe_items row (schema in supabase/migrations) to the UI Garment. */
export function rowToGarment(row: Record<string, unknown>): Garment {
  const colors = Array.isArray(row.colors) ? (row.colors as string[]) : [];
  const coverage = (row.coverage ?? {}) as { shoulders?: boolean; knees?: boolean };
  const meta = [row.fabric, row.subcategory].filter(Boolean).join(' · ');
  return {
    id: String(row.id),
    name: String(row.name ?? 'Untitled'),
    category: (row.category as GarmentCategory) ?? 'top',
    colors: [colors[0] ?? '#C9C3B6', colors[1] ?? colors[0] ?? '#9A948A'],
    fabric: String(row.fabric ?? ''),
    breathability: clampRating(row.breathability),
    formality: clampRating(row.formality),
    coverage: { shoulders: Boolean(coverage.shoulders), knees: Boolean(coverage.knees) },
    meta: meta || 'Catalogued',
  };
}

/** Shape returned by the scan-item edge function (Claude vision). */
export type ScannedGarment = {
  name: string;
  category: GarmentCategory;
  subcategory?: string;
  colors: string[];
  pattern?: string;
  fabric?: string;
  breathability?: number;
  warmth?: number;
  formality?: number;
  coverage: { shoulders: boolean; knees: boolean };
  style_tags?: string[];
  seasons?: string[];
};

/** Send a resized photo to the scan-item edge function; returns garment attributes. */
export async function scanGarment(
  base64: string,
  mediaType = 'image/jpeg'
): Promise<ScannedGarment> {
  if (!supabase) throw new Error('Sign in to scan garments.');
  const { data, error } = await supabase.functions.invoke('scan-item', {
    body: { imageBase64: base64, mediaType },
  });
  if (error) throw new Error(error.message || 'Scan failed — please try again.');
  if (!data?.garment) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Could not read that garment.');
  }
  return data.garment as ScannedGarment;
}

/** Persist a confirmed garment to the signed-in user's closet. */
export async function saveGarment(userId: string, g: ScannedGarment): Promise<void> {
  if (!supabase) throw new Error('Not signed in.');
  const { error } = await supabase.from('wardrobe_items').insert({
    user_id: userId,
    name: g.name,
    category: g.category,
    subcategory: g.subcategory ?? null,
    colors: g.colors ?? [],
    pattern: g.pattern ?? null,
    fabric: g.fabric ?? null,
    breathability: g.breathability ?? null,
    warmth: g.warmth ?? null,
    formality: g.formality ?? null,
    coverage: g.coverage ?? { shoulders: false, knees: false },
    style_tags: g.style_tags ?? [],
    seasons: g.seasons ?? [],
    source: 'scan',
  });
  if (error) throw new Error(error.message);
}

type WardrobeState = {
  items: Garment[];
  loading: boolean;
  /** True when reading the signed-in user's real closet (vs. demo data). */
  live: boolean;
  refresh: () => Promise<void>;
};

export function useWardrobe(): WardrobeState {
  const { user } = useAuth();
  const live = isLive && Boolean(user);
  const [items, setItems] = useState<Garment[]>(live ? [] : mockWardrobe);
  const [loading, setLoading] = useState(live);

  // Pure fetch — returns data, never touches state (so effects only setState
  // after the await, satisfying react-hooks/set-state-in-effect).
  const load = useCallback(async (): Promise<Garment[]> => {
    if (!live || !supabase || !user) return mockWardrobe;
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return error || !data ? [] : data.map(rowToGarment);
  }, [live, user]);

  const refresh = useCallback(async () => {
    const next = await load();
    setItems(next);
    setLoading(false);
  }, [load]);

  useEffect(() => {
    let active = true;
    void load().then((next) => {
      if (active) {
        setItems(next);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [load]);

  return { items, loading, live, refresh };
}

// ---------- trips + plans ----------

export type TripRecord = {
  id: string;
  destination: string;
  country: string;
  countryCode: string;
  startsOn: string; // ISO
  endsOn: string; // ISO
  nights: number;
  activities: string[];
  weather: { highC: number; lowC: number; precipChance: number; label: string } | null;
};

const MMM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** ISO YYYY-MM-DD → "Aug 15" for display. */
export function formatShort(iso: string): string {
  const [, mm, dd] = iso.split('-');
  return `${MMM[Number(mm) - 1] ?? '?'} ${Number(dd)}`;
}

function rowToTripRecord(row: Record<string, unknown>): TripRecord {
  const w = (row.weather_snapshot ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    destination: String(row.destination ?? ''),
    country: String(w.country ?? ''),
    countryCode: String(row.country_code ?? ''),
    startsOn: String(row.starts_on ?? ''),
    endsOn: String(row.ends_on ?? ''),
    nights: Math.max(1, daysUntil(String(row.ends_on), String(row.starts_on)) || 1),
    activities: Array.isArray(row.activities) ? (row.activities as string[]) : [],
    weather:
      w.highC != null
        ? {
            highC: Number(w.highC),
            lowC: Number(w.lowC),
            precipChance: Number(w.precipChance ?? 0),
            label: String(w.label ?? ''),
          }
        : null,
  };
}

/** Geocode + fetch weather + persist a trip for the signed-in user. */
export async function createTrip(
  userId: string,
  args: { destination: string; startISO: string; endISO: string; activities: string[]; luggage: string }
): Promise<TripRecord> {
  if (!supabase) throw new Error('Sign in to plan a trip.');
  const place = await geocode(args.destination);
  if (!place) throw new Error(`Couldn't find "${args.destination}". Try a city name.`);
  const band = await weatherForTrip(place, args.startISO, args.endISO);
  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      destination: place.name,
      country_code: place.countryCode,
      starts_on: args.startISO,
      ends_on: args.endISO,
      activities: args.activities,
      luggage: args.luggage,
      status: 'planned',
      weather_snapshot: {
        country: place.country,
        highC: band.highC,
        lowC: band.lowC,
        precipChance: band.precipChance,
        label: band.label,
        source: band.source,
      },
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToTripRecord(data);
}

function tripToInput(t: TripRecord): TripInput {
  return {
    city: t.destination.split(',')[0].trim(),
    country: t.country,
    countryCode: t.countryCode,
    startsOn: formatShort(t.startsOn),
    endsOn: formatShort(t.endsOn),
    nights: t.nights,
    highTempC: t.weather?.highC ?? 22,
    lowTempC: t.weather?.lowC ?? 14,
    activities: t.activities,
  };
}

/** The user's most recent planned/active trip, or null. Demo has none. */
export function useActiveTrip(): { trip: TripRecord | null; loading: boolean; refresh: () => Promise<void> } {
  const { user } = useAuth();
  const live = isLive && Boolean(user);
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [loading, setLoading] = useState(live);

  const fetchTrip = useCallback(async (): Promise<TripRecord | null> => {
    if (!live || !supabase || !user) return null;
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['planned', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? rowToTripRecord(data) : null;
  }, [live, user]);

  const refresh = useCallback(async () => {
    const next = await fetchTrip();
    setTrip(next);
    setLoading(false);
  }, [fetchTrip]);

  useEffect(() => {
    let active = true;
    void fetchTrip().then((next) => {
      if (active) {
        setTrip(next);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [fetchTrip]);

  return { trip, loading, refresh };
}

type PlanState = { plan: Plan | null; loading: boolean; needsWardrobe: boolean };

/**
 * The plan to render on Packing/Lookbook/Home. Demo → the hand-authored plan.
 * Live → the active trip's plan, generated fresh from the user's wardrobe by
 * the Sudoku engine (so it reflects the current closet).
 */
export function usePlan(): PlanState {
  const { user } = useAuth();
  const live = isLive && Boolean(user);
  const { items, loading: wardrobeLoading } = useWardrobe();
  const { trip, loading: tripLoading } = useActiveTrip();

  return useMemo<PlanState>(() => {
    if (!live) return { plan: demoPlan, loading: false, needsWardrobe: false };
    if (wardrobeLoading || tripLoading) return { plan: null, loading: true, needsWardrobe: false };
    if (!trip) return { plan: null, loading: false, needsWardrobe: false };
    if (items.length === 0) return { plan: null, loading: false, needsWardrobe: true };
    return { plan: generatePlan(items, tripToInput(trip)), loading: false, needsWardrobe: false };
  }, [live, items, wardrobeLoading, trip, tripLoading]);
}
