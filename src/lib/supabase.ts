/**
 * Supabase client — live when EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_KEY are present (see .env.example), otherwise the
 * app runs in demo mode on the mock dataset. Screens must handle both.
 *
 * Auth sessions persist via AsyncStorage (native) / localStorage-backed
 * shim (web) so users stay signed in across launches. URL-based session
 * detection is off — this is a native app, not an OAuth-redirect web app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const isLive = Boolean(url && key);

export const supabase: SupabaseClient | null = isLive
  ? createClient(url!, key!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Password sign-in, not an OAuth redirect — no session in the URL to parse.
        detectSessionInUrl: false,
      },
    })
  : null;
