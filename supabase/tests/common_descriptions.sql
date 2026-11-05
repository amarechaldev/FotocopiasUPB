-- Tests for the common descriptions (0016). Paste into the SQL Editor of the TEST project only,
-- after 0016. Everything runs in one transaction that is rolled back. The first failed check stops
-- the script with its message; success = no error at the end.

begin;

-- How many common descriptions a department has.
create function pg_temp.count_for(p_area text) returns bigint
language sql as $$
  select count(*) from common_descriptions c join areas a on a.id = c.area_id where a.name = p_area
$$;

do $$
begin
  -- All of docs/description-lists.md: a misspelt department name would have dropped rows.
  assert (select count(*) from common_descriptions) = 26, 'all 26 rows';

  assert pg_temp.count_for('Empresariales') = 4, 'Empresariales';
  assert pg_temp.count_for('Ingenierías') = 4, 'Ingenierías';
  assert pg_temp.count_for('Marketing') = 5, 'Marketing';
  assert pg_temp.count_for('DAAE Cultura') = 4, 'DAAE Cultura';
  assert pg_temp.count_for('DAAE Deportes') = 4, 'DAAE Deportes';
  assert pg_temp.count_for('VRA') = 5, 'VRA';
  assert pg_temp.count_for('Administración') = 0, 'Administración has none yet';

  -- The same description twice in one department, ignoring case and accents, is refused.
  begin
    insert into common_descriptions (area_id, description)
    select id, 'examenes' from areas where name = 'Empresariales';
    raise exception 'a second "examenes" in Empresariales was accepted';
  exception when unique_violation then
    null; -- expected
  end;
end;
$$;

rollback;
