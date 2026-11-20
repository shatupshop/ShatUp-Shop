-- ShatUp Shop — Pre-Order products
-- Run ONCE in Supabase SQL Editor. Safe to re-run. Existing products are unaffected.
alter table public.products
  add column if not exists is_preorder boolean not null default false,
  add column if not exists preorder_eta text;   -- e.g. "7-10 days"
