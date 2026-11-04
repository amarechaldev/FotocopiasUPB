-- 0015: the current billing period for the staff form (story #3, task #72).
-- Apply once, in the Supabase SQL Editor, after 0014: first in the test project. In production,
-- apply 0014 and 0015 together at a quiet time, then merge the app right away: the new app reads
-- vague_descriptions (0014) and calls current_period (0015), so it cannot go first. In between,
-- the old app shows a too-vague description as a failure (the database still refuses it).
-- Never edit after applying: write 0016_... instead. Tests: supabase/tests/input_checks.sql.

-- The shared device is not logged in, so it cannot call list_periods (admins only). It only needs
-- the current period (to warn about a date outside it) and the first day of the first period (the
-- earliest date allowed). Always one row; start_date and end_date are null before the first period
-- starts.
create function current_period()
returns table (start_date date, end_date date, first_start date)
language sql
stable
security definer
set search_path = public
as $$
  select p.start_date, p.end_date, first_period_start()
  from (select) as one_row
  left join periods_as_of((now() at time zone 'America/La_Paz')::date) p on p.is_current
$$;

revoke execute on function current_period from public;
grant execute on function current_period to anon, authenticated;
