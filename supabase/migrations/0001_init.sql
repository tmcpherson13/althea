-- Althea schema v1 — wardrobe, trips, outfits, boards, module flags, culture KB.
-- Privacy stance: wardrobe data is private by default; RLS on every user table.

create extension if not exists "uuid-ossp";

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  home_city text,
  sizes jsonb default '{}'::jsonb,
  style_register text check (style_register in ('casual','smart-casual','polished','glam')) default 'smart-casual',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- wardrobe ----------
create table public.wardrobe_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null check (category in ('top','bottom','dress','layer','shoe','accessory')),
  subcategory text,
  photo_path text,
  cutout_path text,
  colors text[] not null default '{}',
  pattern text,
  fabric text,
  breathability smallint check (breathability between 1 and 5),
  warmth smallint check (warmth between 1 and 5),
  formality smallint check (formality between 1 and 5),
  coverage jsonb not null default '{"shoulders": false, "knees": false}'::jsonb,
  style_tags text[] not null default '{}',
  seasons text[] not null default '{}',
  brand text,
  size text,
  source text not null default 'scan' check (source in ('scan','tag','manual','import')),
  created_at timestamptz not null default now()
);
alter table public.wardrobe_items enable row level security;
create policy "own wardrobe" on public.wardrobe_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index wardrobe_items_user_idx on public.wardrobe_items (user_id, category);

-- ---------- trips ----------
create table public.trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  country_code text,
  starts_on date,
  ends_on date,
  trip_type text default 'leisure',
  activities text[] not null default '{}',
  luggage text default 'carry-on' check (luggage in ('carry-on','checked','weekender')),
  laundry_available boolean not null default false,
  status text not null default 'draft' check (status in ('draft','planned','packed','active','done')),
  weather_snapshot jsonb,
  created_at timestamptz not null default now()
);
alter table public.trips enable row level security;
create policy "own trips" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index trips_user_idx on public.trips (user_id, status);

-- ---------- packing plans ----------
create table public.packing_plans (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  item_ids uuid[] not null default '{}',
  stats jsonb not null default '{}'::jsonb,          -- items/outfits/carry-on fit
  culture_brief jsonb,                                -- rendered briefing at plan time
  gaps jsonb not null default '[]'::jsonb,            -- missing items + shop links
  engine_version text not null default 'v0',
  created_at timestamptz not null default now()
);
alter table public.packing_plans enable row level security;
create policy "own plans" on public.packing_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- outfits & boards ----------
create table public.outfits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete cascade,
  name text,
  item_ids uuid[] not null default '{}',
  day_context jsonb,                                  -- temp, evening, modest-site flags
  created_by text not null default 'ai' check (created_by in ('ai','user')),
  created_at timestamptz not null default now()
);
alter table public.outfits enable row level security;
create policy "own outfits" on public.outfits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.boards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete cascade,
  layout jsonb not null default '{}'::jsonb,          -- positions, z-order, scale
  share_slug text unique,                             -- public read-only share page
  created_at timestamptz not null default now()
);
alter table public.boards enable row level security;
create policy "own boards" on public.boards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- module flags (doc 03) ----------
create table public.app_modules (
  key text primary key,
  name text not null,
  min_tier text not null default 'free' check (min_tier in ('free','plus')),
  default_on boolean not null default false,
  rollout_pct smallint not null default 0 check (rollout_pct between 0 and 100)
);
alter table public.app_modules enable row level security;
create policy "modules readable" on public.app_modules for select using (true);

create table public.user_modules (
  user_id uuid not null references auth.users (id) on delete cascade,
  module_key text not null references public.app_modules (key) on delete cascade,
  enabled boolean not null default true,
  primary key (user_id, module_key)
);
alter table public.user_modules enable row level security;
create policy "own module prefs" on public.user_modules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.app_modules (key, name, min_tier, default_on, rollout_pct) values
  ('journal',      'Travel journal',      'free', false, 0),
  ('meetup',       'Meet in the middle',  'plus', false, 0),
  ('deals',        'Deal alerts',         'free', false, 0),
  ('share_studio', 'Share studio',        'free', false, 0);

-- ---------- culture knowledge base (editorially reviewed content) ----------
create table public.culture_norms (
  id uuid primary key default uuid_generate_v4(),
  country_code text not null,
  region text,                                        -- null = countrywide
  headline text not null,
  guidance jsonb not null,                            -- structured rules + notes
  sources text[] not null default '{}',
  review_status text not null default 'draft' check (review_status in ('draft','reviewed','published')),
  version int not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.culture_norms enable row level security;
create policy "published norms readable" on public.culture_norms
  for select using (review_status = 'published');
create unique index culture_norms_locale_idx on public.culture_norms (country_code, coalesce(region, ''));

-- Seed: Morocco (the demo destination), matching the app's mock briefing.
insert into public.culture_norms (country_code, region, headline, guidance, sources, review_status)
values (
  'MA',
  null,
  'In medinas and religious sites, shoulders and knees stay covered.',
  '{
    "coverage": {"shoulders": true, "knees": true, "contexts": ["medina", "religious-site", "rural"]},
    "relaxed_contexts": ["riad", "hotel-pool", "gueliz-evening"],
    "notes": [
      "Beachwear stays at the riad pool.",
      "Evenings in Gueliz are cosmopolitan; smart evening wear is fine there.",
      "For Atlas villages, trousers are a better call than skirts."
    ]
  }'::jsonb,
  '{}',
  'draft'
);

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('wardrobe', 'wardrobe', false);
create policy "own wardrobe photos read" on storage.objects
  for select using (bucket_id = 'wardrobe' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own wardrobe photos write" on storage.objects
  for insert with check (bucket_id = 'wardrobe' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own wardrobe photos delete" on storage.objects
  for delete using (bucket_id = 'wardrobe' and auth.uid()::text = (storage.foldername(name))[1]);
