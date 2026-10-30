-- 0012: a period's end limits come from its month, not from its actual start (story #52).
-- Apply once, in the Supabase SQL Editor, after 0011: first in the test project, then in production
-- before the #52 app is merged. Never edit after applying: write 0013_... instead.
-- Tests: supabase/tests/billing_periods.sql.

-- In 0011, the earliest end was the period's own start, so early closes could chain: November
-- closed on 26/10, then December (27/10–22/12) on 27/10, gave a January period from 28/10.
-- Rule confirmed with the PO: the period of month M (by default 23 of M-1 to 22 of M) can end
--   - from the 23rd of M-1 (and never before its actual start),
--   - to the 21st of M+1 (and always before the next period's actual end, so it keeps a day).
-- E.g. November: 23/10 to 21/12. December: 23/11 to 21/01, even if it started on 24/10.

-- The earliest and latest end the period of p_month can be given. Internal.
create function period_end_limits(p_month date, out earliest_end date, out latest_end date)
language sql stable
set search_path = public
as $$
  select greatest(period_start(p_month), (p_month - interval '1 month')::date + 22),
         least((p_month + interval '1 month')::date + 20,
               period_end((p_month + interval '1 month')::date) - 1)
$$;

revoke execute on function period_end_limits from public, anon, authenticated;

-- Same as 0011, with the limits above. (create or replace keeps 0011's revokes.)
create or replace function apply_period_end(p_month date, p_end date, p_today date) returns void
language plpgsql
set search_path = public
as $$
declare
  limits record;
begin
  if p_end is null then
    raise exception 'date_required';
  end if;
  if not exists (select from periods_as_of(p_today) p where p.month = p_month and p.changeable) then
    raise exception 'period_locked';
  end if;
  select * into limits from period_end_limits(p_month);
  if p_end < limits.earliest_end then
    raise exception 'period_end_too_early';
  end if;
  if p_end > limits.latest_end then
    raise exception 'period_end_too_late';
  end if;

  insert into period_ends (month, end_date) values (p_month, p_end)
  on conflict (month) do update set end_date = excluded.end_date;
end;
$$;

-- The operator's list, now with each period's limits, so the date field only offers valid dates
-- and the rule stays here. Two more columns: it must be dropped first.

drop function list_periods();

create function list_periods()
returns table (month date, start_date date, end_date date, is_current boolean, changeable boolean,
               earliest_end date, latest_end date)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;

  -- Columns are always qualified (p., l.): the output columns above share their names.
  return query
  select p.month, p.start_date, p.end_date, p.is_current, p.changeable, l.earliest_end, l.latest_end
  from periods_as_of((now() at time zone 'America/La_Paz')::date) p
  cross join lateral period_end_limits(p.month) l;
end;
$$;

revoke execute on function list_periods from public, anon;
grant execute on function list_periods to authenticated;
