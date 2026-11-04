-- Tests for the input checks (0014). Paste into the SQL Editor of the TEST project only, after 0014.
-- Everything runs in one transaction that is rolled back: the test account and entries are not
-- kept. The first failed check stops the script with its message; success = no error at the end.
-- Dates are relative to first_period_start(), so they pass whatever the first period is (the test
-- project may have it moved by supabase/dev/first_period_june.sql).

begin;

-- A test account (name unlikely to exist) and one of its departments.
create temp table t as
select create_account('Prueba Controles 0014', '1234', array[a.id], a.id) as account_id,
       a.id as area_id
from (select min(id) as id from areas where active) a;

-- Helpers (pg_temp: they disappear with the session) --------------------------------------

-- A staff entry with 5 copias; returns its id.
create function pg_temp.staff_entry(p_date date, p_description text) returns bigint
language sql as $$
  select register_account_entry(t.account_id, '1234', p_date, t.area_id::smallint,
                                p_description, 5, '[]')
  from t
$$;

-- The staff entry must fail with this exact error code.
create function pg_temp.expect_staff_error(p_date date, p_description text, p_code text)
returns void
language plpgsql as $$
begin
  begin
    perform pg_temp.staff_entry(p_date, p_description);
  exception when others then
    assert sqlerrm = p_code, format('"%s" on %s: expected %s, got %s',
                                    p_description, p_date, p_code, sqlerrm);
    return;
  end;
  raise exception '"%" on %: expected %, but it was saved', p_description, p_date, p_code;
end;
$$;

-- The operator's checks (edits and manual entries) must fail with this exact error code.
create function pg_temp.expect_operator_error(p_date date, p_description text, p_code text)
returns void
language plpgsql as $$
begin
  begin
    perform check_entry(t.account_id, p_date, t.area_id::smallint, p_description, 5, '[]')
    from t;
  exception when others then
    assert sqlerrm = p_code, format('"%s" on %s: expected %s, got %s',
                                    p_description, p_date, p_code, sqlerrm);
    return;
  end;
  raise exception '"%" on %: expected %, but it passed', p_description, p_date, p_code;
end;
$$;

do $$
declare
  first_day date := first_period_start();
begin
  -- Too-vague descriptions: capitals, accents and spaces do not matter.
  perform pg_temp.expect_staff_error(first_day, 'copias', 'description_vague');
  perform pg_temp.expect_staff_error(first_day, '  COPIAS ', 'description_vague');
  perform pg_temp.expect_staff_error(first_day, 'Fotocópias', 'description_vague');
  perform pg_temp.expect_staff_error(first_day, 'documento', 'description_vague');

  -- Only exact matches: longer descriptions are saved.
  assert pg_temp.staff_entry(first_day, 'Copias del examen') is not null, 'longer description';
  assert pg_temp.staff_entry(first_day, 'Exámenes') is not null, 'common description';

  -- Dates: the first day of the first period is fine, the day before is not.
  perform pg_temp.expect_staff_error(first_day - 1, 'Exámenes', 'date_before_first_period');

  -- A wrong PIN is still reported first.
  begin
    perform register_account_entry(t.account_id, '0000', first_day - 1, t.area_id::smallint,
                                   'copias', 5, '[]')
    from t;
    raise exception 'wrong PIN: expected pin_wrong, but it was saved';
  exception when others then
    assert sqlerrm = 'pin_wrong', format('wrong PIN: expected pin_wrong, got %s', sqlerrm);
  end;

  -- The operator: edits and manual entries use check_entry.
  perform pg_temp.expect_operator_error(first_day, ' Fotocopia ', 'description_vague');
  perform pg_temp.expect_operator_error(first_day - 1, 'Exámenes', 'date_before_first_period');
  assert (select check_entry(t.account_id, first_day, t.area_id::smallint, 'Copias del examen',
                             5, '[]') from t) = 'Prueba Controles 0014', 'operator: valid entry';
end;
$$;

rollback;
