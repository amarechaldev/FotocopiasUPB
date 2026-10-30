-- Tests for 0011 (billing periods). Paste into the SQL Editor of the TEST project only, after 0011.
-- Everything runs in one transaction that is rolled back: no data is left behind, and the real
-- moved ends (if any) are untouched. The first failed check stops the script with its message;
-- success = the script ends without an error.
-- Dates are pretended with the p_today parameter, so the PO's examples can be checked any day.

begin;

delete from period_ends; -- start from the default periods (undone by the rollback)

-- Helpers (pg_temp: they disappear with the session) --------------------------------------

-- The period that contains p_today, as "start..end", e.g. '2027-03-23..2027-04-22'.
create function pg_temp.current_of(p_today date) returns text
language sql as $$
  select start_date || '..' || end_date from periods_as_of(p_today) where is_current
$$;

-- No gaps, no overlaps, no empty period.
create function pg_temp.assert_contiguous(p_today date) returns void
language plpgsql as $$
declare
  p record;
  previous_end date := null;
begin
  for p in select * from periods_as_of(p_today) loop
    assert p.start_date <= p.end_date, format('period %s ends before it starts', p.month);
    assert previous_end is null or p.start_date = previous_end + 1,
      format('gap or overlap before period %s', p.month);
    previous_end := p.end_date;
  end loop;
end;
$$;

-- apply_period_end must fail with this exact error code.
create function pg_temp.expect_error(p_month date, p_end date, p_today date, p_code text)
returns void
language plpgsql as $$
begin
  begin
    perform apply_period_end(p_month, p_end, p_today);
  exception when others then
    assert sqlerrm = p_code, format('expected %s, got %s', p_code, sqlerrm);
    return;
  end;
  raise exception 'expected %, but the end was accepted', p_code;
end;
$$;

-- Default periods -----------------------------------------------------------------------

do $$
begin
  -- 30/10/2026: the first period is current, and there is no previous one.
  assert (select count(*) from periods_as_of('2026-10-30')) = 2, 'first period and the next one';
  assert pg_temp.current_of('2026-10-30') = '2026-10-23..2026-11-22', 'first period';
  assert (select changeable from periods_as_of('2026-10-30') where month = '2026-11-01'), 'first period changeable';
  assert not (select changeable from periods_as_of('2026-10-30') where month = '2026-12-01'), 'next period locked';
  assert (select start_date || '..' || end_date from periods_as_of('2026-10-30')
          where month = '2026-12-01') = '2026-11-23..2026-12-22', 'next period by default';

  -- Boundaries: the 22nd belongs to the period ending then, the 23rd to the next one.
  assert pg_temp.current_of('2026-11-22') = '2026-10-23..2026-11-22', '22nd';
  assert pg_temp.current_of('2026-11-23') = '2026-11-23..2026-12-22', '23rd';

  -- 10/04/2027: current Mar 23–Apr 22, previous (March) changeable, older ones locked.
  assert pg_temp.current_of('2027-04-10') = '2027-03-23..2027-04-22', 'April period';
  assert (select count(*) from periods_as_of('2027-04-10')) = 7, 'Nov 2026 to May 2027';
  assert (select array_agg(month order by month) from periods_as_of('2027-04-10') where changeable)
         = array[date '2027-03-01', date '2027-04-01'], 'only March and April changeable';
  assert (select count(*) from periods_as_of('2026-10-01')) = 0, 'nothing before the first period';
  perform pg_temp.assert_contiguous('2027-04-10');
end $$;

-- PO example: the period Mar 23–Apr 22 can end from Mar 23 up to May 21 ------------------

do $$
begin
  -- Earliest: its own start (one day). Today (Apr 10) then falls into the May period.
  perform apply_period_end('2027-04-01', '2027-03-23', '2027-04-10');
  assert (select start_date || '..' || end_date from periods_as_of('2027-04-10')
          where month = '2027-04-01') = '2027-03-23..2027-03-23', 'one-day period';
  assert pg_temp.current_of('2027-04-10') = '2027-03-24..2027-05-22', 'May period almost two months';
  perform pg_temp.assert_contiguous('2027-04-10');
  delete from period_ends;

  perform pg_temp.expect_error('2027-04-01', '2027-03-22', '2027-04-10', 'period_end_too_early');

  -- Latest: the day before the next default end; the May period then lasts one day.
  perform apply_period_end('2027-04-01', '2027-05-21', '2027-04-10');
  assert (select start_date || '..' || end_date from periods_as_of('2027-04-10')
          where month = '2027-05-01') = '2027-05-22..2027-05-22', 'next period lasts one day';
  perform pg_temp.assert_contiguous('2027-04-10');
  delete from period_ends;

  perform pg_temp.expect_error('2027-04-01', '2027-05-22', '2027-04-10', 'period_end_too_late');
  perform pg_temp.expect_error('2027-04-01', null, '2027-04-10', 'date_required');

  -- Older than the previous period: locked. A future period: locked.
  perform pg_temp.expect_error('2027-02-01', '2027-02-20', '2027-04-10', 'period_locked');
  perform pg_temp.expect_error('2027-05-01', '2027-05-20', '2027-04-10', 'period_locked');

  -- Changing an end twice keeps only the last one.
  perform apply_period_end('2027-04-01', '2027-04-25', '2027-04-10');
  perform apply_period_end('2027-04-01', '2027-04-23', '2027-04-10');
  assert pg_temp.current_of('2027-04-10') = '2027-03-23..2027-04-23', 'last change wins';
  delete from period_ends;
end $$;

-- PO: the previous period's end can move to tomorrow; today then falls back into it ----------

do $$
begin
  -- 24/04/2027: current Apr 23–May 22 (May), previous Mar 23–Apr 22 (April).
  assert pg_temp.current_of('2027-04-24') = '2027-04-23..2027-05-22', 'May period';
  perform apply_period_end('2027-04-01', '2027-04-25', '2027-04-24');
  assert pg_temp.current_of('2027-04-24') = '2027-03-23..2027-04-25', 'today back in April';
  assert (select start_date from periods_as_of('2027-04-24') where month = '2027-05-01')
         = '2027-04-26', 'May starts the day after';
  -- April is current again, so March becomes "previous" and changeable.
  assert (select changeable from periods_as_of('2027-04-24') where month = '2027-03-01'), 'March changeable';
  perform pg_temp.assert_contiguous('2027-04-24');
  delete from period_ends;
end $$;

-- The previous end must stay before the current period's actual end if it was moved earlier --

do $$
begin
  -- 10/04/2027: close April early on Apr 5; today is then in May (Apr 6–May 22).
  perform apply_period_end('2027-04-01', '2027-04-05', '2027-04-10');
  -- Close May early too, on Apr 12 (May is current, April previous).
  perform apply_period_end('2027-05-01', '2027-04-12', '2027-04-10');
  -- Moving April's end to Apr 12 would leave May empty; Apr 11 leaves it one day.
  perform pg_temp.expect_error('2027-04-01', '2027-04-12', '2027-04-10', 'period_end_too_late');
  perform apply_period_end('2027-04-01', '2027-04-11', '2027-04-10');
  assert (select start_date || '..' || end_date from periods_as_of('2027-04-10')
          where month = '2027-05-01') = '2027-04-12..2027-04-12', 'May one day';
  perform pg_temp.assert_contiguous('2027-04-10');
  delete from period_ends;
end $$;

-- Access from the browser ----------------------------------------------------------------
-- The SQL Editor runs as the database owner. These lines make it act like the browser of a
-- logged-in user who is NOT in admins (a made-up user id), as Supabase does with each request.

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000000", "role": "authenticated"}';

do $$
begin
  begin
    perform list_periods();
    raise exception 'list_periods: expected not_admin';
  exception when others then
    assert sqlerrm = 'not_admin', 'list_periods: ' || sqlerrm;
  end;
  begin
    perform set_period_end('2026-11-01', '2026-11-20');
    raise exception 'set_period_end: expected not_admin';
  exception when others then
    assert sqlerrm = 'not_admin', 'set_period_end: ' || sqlerrm;
  end;
  begin
    perform periods_as_of('2026-10-30');
    raise exception 'periods_as_of should not be callable';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from period_ends;
    raise exception 'period_ends should not be readable';
  exception when insufficient_privilege then null;
  end;
end $$;

-- The shared device (not logged in) cannot call the operator's functions at all.
set local role anon;
do $$
begin
  begin
    perform list_periods();
    raise exception 'anon: list_periods should not be callable';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;

select 'All billing period tests passed' as result;

rollback;
