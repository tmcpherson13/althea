/**
 * Supabase client — live when EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_KEY are present (see .env.example), otherwise the
 * app runs in demo mode on the mock dataset. Screens must handle both.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const isLive = Boolean(url && key);

export const supabase: SupabaseClient | null = isLive ? createClient(url!, key!) : null;
