/**
 * Live-or-mock data layer. Hooks read from Supabase when the app is live and
 * the user is signed in; otherwise they return the demo dataset instantly.
 * Screens consume these hooks and never branch on `isLive` themselves.
 */

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { wardrobe as mockWardrobe } from '@/lib/mock';
import { isLive, supabase } from '@/lib/supabase';
import type { Garment, GarmentCategory } from '@/lib/types';

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
