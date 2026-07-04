-- Explicit "active trip" selection.
--
-- Before this, the active trip (the one that drives Home / Packing / Lookbook)
-- was implicitly the user's most-recently-created planned/active trip. The
-- trips-management screen lets the user keep several trips and choose which one
-- is current, so we persist that choice on the profile. ON DELETE SET NULL means
-- deleting the selected trip cleanly falls back to the implicit most-recent one.

alter table public.profiles
  add column if not exists selected_trip_id uuid
    references public.trips (id) on delete set null;
