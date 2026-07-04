/**
 * Auth context. Two modes:
 *  - Live (Supabase configured): real email/password auth; session persists
 *    across launches; a profile row is bootstrapped on first sign-in.
 *  - Demo (no Supabase env, e.g. CI or a fresh clone): auth is skipped
 *    entirely and the app runs on the mock dataset. `requiresAuth` is false.
 *
 * Screens never talk to supabase.auth directly — they read this context.
 */

import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { isLive, supabase } from '@/lib/supabase';

type AuthResult = { error: string | null };

type AuthContextValue = {
  /** True only in live mode; demo builds never gate on auth. */
  requiresAuth: boolean;
  /** Session known (either a real session, or confirmed signed-out / demo). */
  ready: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function bootstrapProfile(user: User) {
  if (!supabase) return;
  // Idempotent: upsert a profile row keyed by the auth user id.
  await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: user.email?.split('@')[0] ?? null }, { onConflict: 'id' });
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isLive); // demo mode is ready immediately

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) void bootstrapProfile(next.user);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      requiresAuth: isLive,
      ready,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [ready, session, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
