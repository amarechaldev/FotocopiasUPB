-- DEV ONLY (fotocopias-upb-dev). Undoes first_period_june.sql: the first period starts again on
-- 23/10/2026, as in 0011.

create or replace function first_period_month() returns date
language sql immutable
as $$ select date '2026-11-01' $$;

create or replace function first_period_start() returns date
language sql immutable
as $$ select date '2026-10-23' $$;

-- Moved ends saved for periods that no longer exist.
delete from period_ends where month < date '2026-11-01';
