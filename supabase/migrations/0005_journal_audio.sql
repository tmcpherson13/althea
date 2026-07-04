-- Voice notes on journal moments.
--
-- Audio recordings live in the same private `journal` bucket as photos
-- (owner-scoped by user id, served via short-lived signed URLs). Stored as an
-- array so a moment can carry more than one clip over time.

alter table public.journal_entries
  add column if not exists audio_paths text[] not null default '{}';
