/**
 * Feature-flag module registry (doc 03 of the scoping package).
 * Static defaults now; Phase 2 reads `app_modules` / `user_modules`
 * from Supabase and merges per-user state over these.
 */

export type ModuleKey = 'journal' | 'meetup' | 'deals' | 'share_studio';

export type AppModule = {
  key: ModuleKey;
  name: string;
  description: string;
  enabled: boolean;
  phase: string;
};

export const modules: AppModule[] = [
  {
    key: 'journal',
    name: 'Travel journal',
    description: 'Map your journey, record moments, share a recap.',
    enabled: true,
    phase: 'Phase 2',
  },
  {
    key: 'meetup',
    name: 'Meet in the middle',
    description: 'Best hub for friends flying from different cities.',
    enabled: false,
    phase: 'Phase 2–3',
  },
  {
    key: 'deals',
    name: 'Deal alerts',
    description: 'Fare drops on routes you care about.',
    enabled: false,
    phase: 'Phase 2',
  },
  {
    key: 'share_studio',
    name: 'Share studio',
    description: 'Gorgeous recap assets for Instagram, X & more.',
    enabled: false,
    phase: 'MVP polish',
  },
];

export const isModuleEnabled = (key: ModuleKey): boolean =>
  modules.find((m) => m.key === key)?.enabled ?? false;
