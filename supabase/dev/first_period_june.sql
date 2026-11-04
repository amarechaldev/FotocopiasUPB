-- DEV ONLY (fotocopias-upb-dev). NEVER run in production.
-- Moves the first billing period back to 23/06/2026 (the July period), so that older periods exist
-- and the "only the current and previous period can be changed" rule can be tested.
-- Undo with supabase/dev/first_period_restore.sql.
-- Not a migration: it replaces two functions from 0011 and keeps their grants.

create or replace function first_period_month() returns date
language sql immutable
as $$ select date '2026-07-01' $$;

create or replace function first_period_start() returns date
language sql immutable
as $$ select date '2026-06-23' $$;
