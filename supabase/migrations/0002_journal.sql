-- Journal (trip recording) — Polarsteps-style moments: a place, a date, a
-- caption, photos, and an optional voice note, plotted on a map by lat/lon.

create table public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  taken_at timestamptz not null default now(),
  place_name text,
  latitude double precision,
  longitude double precision,
  caption text,
  media_paths text[] not null default '{}',
  voice_path text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.journal_entries enable row level security;
create policy "own journal" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index journal_entries_user_idx on public.journal_entries (user_id, taken_at);

-- Private media bucket, owner-scoped by the first path segment (the user id).
insert into storage.buckets (id, name, public) values ('journal', 'journal', false);
create policy "own journal media read" on storage.objects
  for select using (bucket_id = 'journal' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own journal media write" on storage.objects
  for insert with check (bucket_id = 'journal' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own journal media delete" on storage.objects
  for delete using (bucket_id = 'journal' and auth.uid()::text = (storage.foldername(name))[1]);
