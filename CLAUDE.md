# Althea — agent notes

Women's travel app: wardrobe scanning → destination-aware packing → outfit
lookbook. Scoping docs live in `tmcpherson13/crucible-platform` under
`docs/travel-app/` (branch `claude/womens-travel-app-scope-qkzea6`).

## Rules of the road

- Design tokens live in `src/constants/theme.ts` — never hard-code colors in
  screens; add a token. Both light and dark palettes must stay in sync.
- `src/lib/engine.ts` stays pure TypeScript (no React/RN imports) so vitest
  runs it in Node. Culture rules are checked before climate rules; first
  failure wins.
- All AI and third-party calls go through Supabase Edge Functions
  (`supabase/functions/`), never the client. Client env only gets
  `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_KEY`.
- Screens must work in demo mode (`isLive === false` in `src/lib/supabase.ts`)
  — mock data comes from `src/lib/mock.ts` and mirrors the DB schema.
- Verify before pushing: `npm run typecheck && npm run lint && npm test`.

## Product principles (from the scoping docs)

- Never paywall: offline access, backups, privacy controls, or the core loop.
- Every trip parameter stays editable after plan generation; the plan updates
  in place (PackPoint's most-hated failure).
- Culture guidance is editorially reviewed content (`culture_norms` table),
  not live LLM output.
