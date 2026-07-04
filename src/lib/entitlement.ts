import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { isLive, supabase } from '@/lib/supabase';

/**
 * Free-tier caps. Althea Plus removes them. Kept small and honest — the free
 * tier is genuinely usable (one trip at a time, a real starter closet), and
 * the limits are the natural moment to offer the upgrade.
 */
export const FREE_LIMITS = { activeTrips: 1, wardrobeItems: 50 } as const;

/** Marketing copy for the paywall. Prices are display-only until billing wires in. */
export const PLUS = {
  name: 'Althea Plus',
  priceMonthly: '$4.99',
  priceYearly: '$39.99',
  tagline: 'Everything Althea, without limits.',
  features: [
    'Unlimited trips & capsules',
    'Unlimited wardrobe items',
    'Ad-free, always',
    'Priority AI garment scanning',
    'Early access to new modules',
  ],
} as const;

/**
 * Whether the signed-in user has Althea Plus. Source of truth is
 * profiles.is_plus. This is the seam for RevenueCat: on a native build,
 * refresh() reconciles is_plus from the RevenueCat entitlement after a
 * purchase or restore. Demo/signed-out is always free.
 */
export function useEntitlement(): {
  plus: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { user } = useAuth();
  const live = isLive && Boolean(user);
  const [plus, setPlus] = useState(false);
  const [loading, setLoading] = useState(live);

  const load = useCallback(async (): Promise<boolean> => {
    if (!live || !supabase || !user) return false;
    const { data } = await supabase
      .from('profiles')
      .select('is_plus')
      .eq('id', user.id)
      .maybeSingle();
    return Boolean(data?.is_plus);
  }, [live, user]);

  const refresh = useCallback(async () => {
    setPlus(await load());
    setLoading(false);
  }, [load]);

  useEffect(() => {
    let active = true;
    void load().then((v) => {
      if (active) {
        setPlus(v);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [load]);

  return { plus, loading, refresh };
}

/**
 * Placeholder for the purchase flow. On a production build this is replaced by
 * RevenueCat's `Purchases.purchasePackage(...)`, and the entitlement is granted
 * server-side by the store webhook. For now it flips profiles.is_plus so the
 * gated features can be exercised end-to-end without a billing account.
 */
export async function startPlusCheckout(userId: string): Promise<void> {
  if (!supabase) throw new Error('Sign in to upgrade.');
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, is_plus: true }, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

/** Undo the placeholder unlock (RevenueCat manages this on a real build). */
export async function cancelPlus(userId: string): Promise<void> {
  if (!supabase) throw new Error('Not signed in.');
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, is_plus: false }, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}
