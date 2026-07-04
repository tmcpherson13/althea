-- Althea Plus entitlement.
--
-- Source of truth for the paid ad-free tier. On a production build this is
-- reconciled from the store (RevenueCat entitlement → backend webhook flips
-- this flag); until billing is wired, the paywall's checkout placeholder sets
-- it directly so the gated features can be exercised end-to-end.

alter table public.profiles
  add column if not exists is_plus boolean not null default false;
