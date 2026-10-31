-- 0011: billing periods whose end date the operator can move (story #52).
-- Apply once, in the Supabase SQL Editor, after 0010: first in the test project, then in production
-- after the merge. Safe before the app that uses it (nothing calls it yet).
-- Never edit after applying: write 0012_... instead. Tests: supabase/tests/0011_billing_periods.sql.

-- A period is named by its month: the first day of the month of its default end, the 22nd.
-- E.g. 2026-11-01 is the period that ends on 22/11/2026 unless the operator moves its end.
-- Its start is always the day after the previous period's end, so periods never overlap and
-- never leave a gap. Rules for moving an end (PO, story #52):
--   - only the current period (the one containing today, in Bolivia) and the one before it;
--   - not before the period's own start (a one-day period is allowed);
--   - not on or after the next period's default end (so the next period keeps at least one day).

-- Moved ends only: a period with no row here ends on its 22nd.
create table period_ends (
  month date primary key check (extract(day from month) = 1),
  end_date date not null
);

-- No policies and no grants: the browser only reaches it through the functions below (see 0010).
alter table period_ends enable row level security;
revoke all on period_ends from anon, authenticated;

-- The first period ---------------------------------------------------------------------
-- Provisional start (the operator may give another date): changing it is a new migration
-- that replaces these two functions.

create function first_period_month() returns date
language sql immutable
as $$ select date '2026-11-01' $$;

create function first_period_start() returns date
language sql immutable
as $$ select date '2026-10-23' $$;

-- The rule, in one place ------------------------------------------------------------------

create function period_end(p_month date) returns date
language sql stable
set search_path = public
as $$
  select coalesce((select end_date from period_ends where month = p_month), p_month + 21)
$$;

create function period_start(p_month date) returns date
language sql stable
set search_path = public
as $$
  select case
    when p_month = first_period_month() then first_period_start()
    else period_end((p_month - interval '1 month')::date) + 1
  end
$$;

-- Every period from the first one up to the one after the current period, oldest first.
-- "Today" is a parameter so that the tests can pretend any date; the app uses list_periods.
-- Empty before the first period starts.
create function periods_as_of(p_today date)
returns table (month date, start_date date, end_date date, is_current boolean, changeable boolean)
language sql stable
set search_path = public
as $$
  with all_periods as (
    -- 24 months ahead: far more than the current period can ever be from today's month.
    select m::date as month, period_start(m::date) as start_date, period_end(m::date) as end_date
    from generate_series(first_period_month()::timestamp,
                         date_trunc('month', p_today::timestamp) + interval '24 months',
                         interval '1 month') as m
  ),
  current_period as (
    select a.month from all_periods a where p_today between a.start_date and a.end_date
  )
  select a.month, a.start_date, a.end_date,
         a.month = c.month as is_current,
         a.month in (c.month, (c.month - interval '1 month')::date) as changeable
  from all_periods a cross join current_period c
  where a.month <= c.month + interval '1 month'
  order by a.month
$$;

-- Checks a new end date for a period, then saves it. Errors: date_required, period_locked,
-- period_end_too_early, period_end_too_late.
create function apply_period_end(p_month date, p_end date, p_today date) returns void
language plpgsql
set search_path = public
as $$
declare
  next_month date := (p_month + interval '1 month')::date;
begin
  if p_end is null then
    raise exception 'date_required';
  end if;
  if not exists (select from periods_as_of(p_today) p where p.month = p_month and p.changeable) then
    raise exception 'period_locked';
  end if;
  if p_end < period_start(p_month) then
    raise exception 'period_end_too_early';
  end if;
  -- Before the next period's default end, and before its actual end if that was moved earlier.
  if p_end >= least(next_month + 21, period_end(next_month)) then
    raise exception 'period_end_too_late';
  end if;

  insert into period_ends (month, end_date) values (p_month, p_end)
  on conflict (month) do update set end_date = excluded.end_date;
end;
$$;

-- Internal: not callable from the browser.
revoke execute on function first_period_month, first_period_start, period_end, period_start,
  periods_as_of, apply_period_end from public, anon, authenticated;

-- For the operator's screens ----------------------------------------------------------------
-- Admins only (0005); anyone else gets 'not_admin'.

create function list_periods()
returns table (month date, start_date date, end_date date, is_current boolean, changeable boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  return query select * from periods_as_of((now() at time zone 'America/La_Paz')::date);
end;
$$;

create function set_period_end(p_month date, p_end date) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  perform apply_period_end(p_month, p_end, (now() at time zone 'America/La_Paz')::date);
end;
$$;

revoke execute on function list_periods, set_period_end from public, anon;
grant execute on function list_periods, set_period_end to authenticated;
