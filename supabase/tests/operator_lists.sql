-- Tests for the operator's lists (0021 to 0023). Paste into the SQL Editor of the TEST project only,
-- after 0023.
-- Everything runs in one transaction that is rolled back: no data is left behind. The first failed
-- check stops the script with its message; success = no error at the end.
-- Dates are pretended with p_today: "today" is 10/03/2027, so the current period is March 2027
-- (23/02–22/03), the previous one February (23/01–22/02). The project needs a row in admins, and the
-- too-vague description "Copias" (0014).
-- The department checks are triggers deferred to the end of the transaction, which never comes here
-- (the script rolls back): the helpers force them with "set constraints all immediate".

begin;

delete from period_ends; -- default periods (undone by the rollback)

-- Test rows, by label: a statement must pick one with its label, or it runs once per row.
create temp table d (label text primary key, id smallint);   -- departments
create temp table acc (label text primary key, id bigint);   -- staff accounts
create temp table e (label text primary key, id bigint);     -- entries

-- Helpers (pg_temp: they disappear with the session) --------------------------------------

create function pg_temp.as_operator() returns void
language sql as $$
  select set_config('request.jwt.claims',
                    json_build_object('sub', (select user_id from admins limit 1))::text, true)
$$;

create function pg_temp.as_stranger() returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid())::text, true)
$$;

create function pg_temp.area(p_label text) returns smallint
language sql as $$ select id from d where label = p_label $$;

create function pg_temp.account(p_label text) returns bigint
language sql as $$ select id from acc where label = p_label $$;

create function pg_temp.entry(p_label text) returns bigint
language sql as $$ select id from e where label = p_label $$;

-- The statement must work, including the deferred checks.
create function pg_temp.ok(p_sql text) returns void
language plpgsql as $$
begin
  execute p_sql;
  set constraints all immediate;
  set constraints all deferred;
end;
$$;

-- The statement, or the deferred checks after it, must fail with this exact error code.
create function pg_temp.expect_error(p_sql text, p_code text) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
    set constraints all immediate;
  exception when others then
    set constraints all deferred;
    assert sqlerrm = p_code, format('%s: expected %s, got %s', p_sql, p_code, sqlerrm);
    return;
  end;
  set constraints all deferred;
  raise exception '%: expected %, but it worked', p_sql, p_code;
end;
$$;

-- An operator's manual entry of 1 copia; returns its id.
create function pg_temp.manual(p_account text, p_area text, p_date date) returns bigint
language plpgsql as $$
declare
  new_id bigint;
begin
  new_id := register_manual_entry(pg_temp.account(p_account), p_date, pg_temp.area(p_area),
                                  'Prueba listas 0021', 1, '[]');
  set constraints all immediate;
  set constraints all deferred;
  return new_id;
end;
$$;

-- Moves an entry to another department and date, as the operator's editor does.
create function pg_temp.edit_sql(p_entry text, p_account text, p_area text, p_date date) returns text
language sql as $$
  select format('select update_entry(%s, %s, %L::date, %s::smallint, %L, 1, %L)',
                pg_temp.entry(p_entry), pg_temp.account(p_account), p_date, pg_temp.area(p_area),
                'Prueba listas 0021', '[]')
$$;

do $$ begin
  assert exists (select from admins), 'no admin in this project: log in once as the operator';
  assert exists (select from vague_descriptions where description = 'Copias'), 'too-vague "Copias" missing';
end $$;

-- Not the operator: every operator function refuses --------------------------------------------

select pg_temp.as_stranger();
select pg_temp.expect_error($$select create_area('Prueba Depto X')$$, 'not_admin');
select pg_temp.expect_error($$select rename_area(1::smallint, 'Prueba Depto X')$$, 'not_admin');
select pg_temp.expect_error($$select archive_area(1::smallint, '2027-03-01')$$, 'not_admin');
select pg_temp.expect_error($$select reactivate_area(1::smallint)$$, 'not_admin');
select pg_temp.expect_error($$select create_anillado_size(98::smallint, '2027-03-01', 800)$$, 'not_admin');
select pg_temp.expect_error($$select save_common_description(null, 'Prueba', array[1]::smallint[])$$, 'not_admin');
select pg_temp.expect_error($$select delete_common_description('Exámenes')$$, 'not_admin');
select pg_temp.expect_error($$select save_vague_description(null, 'Prueba')$$, 'not_admin');
select pg_temp.expect_error($$select delete_vague_description('Copias')$$, 'not_admin');

select pg_temp.as_operator();

-- Departments: create and rename ----------------------------------------------------------------

insert into d values ('a', create_area('  Prueba   Depto A ')), ('b', create_area('Prueba Depto B')),
                     ('c', create_area('Prueba Depto C'));

do $$ begin
  assert (select name from areas where id = pg_temp.area('a')) = 'Prueba Depto A', 'name cleaned';
  assert (select active from areas where id = pg_temp.area('a')), 'a new department is active';
  assert pg_temp.area('c') = (select max(id) from areas), 'last in the order of the report';
end $$;

select pg_temp.expect_error($$select create_area('prueba depto a')$$, 'area_name_taken');
select pg_temp.expect_error($$select create_area('PRUEBA DEPTÓ B')$$, 'area_name_taken');
select pg_temp.expect_error($$select create_area('   ')$$, 'name_required');
select pg_temp.expect_error($$select create_area(null)$$, 'name_required');

select pg_temp.ok($$select rename_area(pg_temp.area('a'), 'Prueba Depto Alfa')$$);
select pg_temp.ok($$select rename_area(pg_temp.area('a'), 'prueba depto alfa')$$); -- its own name
select pg_temp.expect_error($$select rename_area(pg_temp.area('a'), 'Prueba Depto B')$$, 'area_name_taken');
select pg_temp.expect_error($$select rename_area(pg_temp.area('a'), '')$$, 'name_required');
select pg_temp.expect_error($$select rename_area(32000::smallint, 'Prueba Depto Z')$$, 'area_invalid');

-- Staff accounts and an entry -------------------------------------------------------------------
-- uno: Alfa by default, B too. dos: B by default. tres: Alfa by default, B too, but archived.

insert into acc values
  ('uno', create_account('Prueba Listas Uno', '5555', array[pg_temp.area('a'), pg_temp.area('b')], pg_temp.area('a'))),
  ('dos', create_account('Prueba Listas Dos', '6666', array[pg_temp.area('b')], pg_temp.area('b'))),
  ('tres', create_account('Prueba Listas Tres', '7777', array[pg_temp.area('a'), pg_temp.area('b')], pg_temp.area('a')));
update accounts set archived = true where id = pg_temp.account('tres');

insert into e values ('mar', pg_temp.manual('uno', 'b', '2027-03-01'));

-- Archiving a department -------------------------------------------------------------------------

select pg_temp.expect_error($$select apply_area_archived(pg_temp.area('b'), '2027-03-01', '2027-03-10')$$,
                            'area_in_use');
select pg_temp.expect_error($$select apply_area_archived(pg_temp.area('b'), '2027-01-01', '2027-03-10')$$,
                            'period_locked');
select pg_temp.expect_error($$select apply_area_archived(32000::smallint, '2027-03-01', '2027-03-10')$$,
                            'area_invalid');

-- The operator moves the March entry to another department first, then archiving works.
select pg_temp.ok(pg_temp.edit_sql('mar', 'uno', 'a', '2027-03-01'));
select pg_temp.ok($$select apply_area_archived(pg_temp.area('b'), '2027-03-01', '2027-03-10')$$);

do $$ begin
  assert (select archived_from from areas where id = pg_temp.area('b')) = '2027-03-01', 'archived from March';
  assert not (select active from areas where id = pg_temp.area('b')), 'no longer active';
  -- A warning only for uno: dos has it as default, tres is archived.
  assert (select count(*) from account_area_notices where area_id = pg_temp.area('b')) = 1, 'one notice';
  assert exists (select from account_area_notices where account_id = pg_temp.account('uno')), 'notice for uno';
  assert (select archived_area_names from list_accounts() where id = pg_temp.account('uno'))
         = array['Prueba Depto B'], 'uno: warning';
  assert not (select default_area_archived from list_accounts() where id = pg_temp.account('uno')), 'uno: default ok';
  assert (select default_area_archived from list_accounts() where id = pg_temp.account('dos')), 'dos: new default';
  assert (select archived_area_names from list_accounts() where id = pg_temp.account('dos')) = '{}', 'dos: no warning';
  assert not exists (select from list_accounts() where id = pg_temp.account('tres')), 'tres: not listed';
end $$;

-- Entries: before March still valid, from March refused.
insert into e values ('feb15', pg_temp.manual('uno', 'b', '2027-02-15')),
                     ('feb20', pg_temp.manual('uno', 'b', '2027-02-20'));
select pg_temp.expect_error($$select pg_temp.manual('uno', 'b', '2027-03-05')$$, 'area_not_valid');
select pg_temp.expect_error($$select register_account_entry(pg_temp.account('dos'), '6666', '2027-03-05',
  pg_temp.area('b'), 'Prueba listas 0021', 1, '[]')$$, 'area_not_valid');
-- Moving a February entry into March: refused with B, accepted with another department.
select pg_temp.expect_error(pg_temp.edit_sql('feb20', 'uno', 'b', '2027-03-02'), 'area_not_valid');
select pg_temp.ok(pg_temp.edit_sql('feb20', 'uno', 'a', '2027-03-02'));
-- Moving February's end earlier, which would put the 15/02 entry in March.
select pg_temp.expect_error($$select apply_period_end('2027-02-01', '2027-02-12', '2027-03-10')$$,
                            'area_not_valid');
select pg_temp.ok($$select apply_period_end('2027-02-01', '2027-02-18', '2027-03-10')$$); -- 15/02 stays
-- Archiving from February directly in the table, bypassing the function: the trigger refuses it.
select pg_temp.expect_error($$update areas set archived_from = '2027-02-01' where id = pg_temp.area('b')$$,
                            'area_not_valid');

-- Warnings dismissed; reactivating clears those left.
select dismiss_area_notices(pg_temp.account('uno'));
do $$ begin
  assert (select archived_area_names from list_accounts() where id = pg_temp.account('uno')) = '{}', 'dismissed';
end $$;
insert into account_area_notices values (pg_temp.account('uno'), pg_temp.area('b'));
select pg_temp.ok($$select reactivate_area(pg_temp.area('b'))$$);
do $$ begin
  assert (select active from areas where id = pg_temp.area('b')), 'active again';
  assert not exists (select from account_area_notices where area_id = pg_temp.area('b')), 'notices cleared';
  assert not (select default_area_archived from list_accounts() where id = pg_temp.account('dos')), 'dos: ok again';
end $$;
insert into e values ('mar5', pg_temp.manual('uno', 'b', '2027-03-05'));

-- Anillado sizes ---------------------------------------------------------------------------------

select pg_temp.ok($$select apply_new_size(98::smallint, '2027-03-01', 800, '2027-03-10')$$);
do $$ begin
  assert (select price_centavos from anillado_prices where size_mm = 98 and from_month = '2027-03-01') = 800,
    'new size with its first price';
  assert (select archived_from from anillado_sizes where size_mm = 98) is null, 'new size active';
end $$;
select pg_temp.expect_error($$select apply_new_size(98::smallint, '2027-03-01', 800, '2027-03-10')$$, 'size_taken');
select pg_temp.expect_error($$select apply_new_size(0::smallint, '2027-03-01', 800, '2027-03-10')$$, 'size_invalid');
select pg_temp.expect_error($$select apply_new_size(-3::smallint, '2027-03-01', 800, '2027-03-10')$$, 'size_invalid');
select pg_temp.expect_error($$select apply_new_size(97::smallint, '2027-03-01', 0, '2027-03-10')$$,
                            'price_not_positive');
select pg_temp.expect_error($$select apply_new_size(97::smallint, '2027-01-01', 800, '2027-03-10')$$,
                            'period_locked');
do $$ begin
  assert not exists (select from anillado_sizes where size_mm = 97), 'a refused price creates no size';
end $$;

-- Common descriptions ----------------------------------------------------------------------------

select pg_temp.ok($$select save_common_description(null, ' Prueba  común ', array[pg_temp.area('a')])$$);
do $$ begin
  assert (select description from common_descriptions where area_id = pg_temp.area('a')) = 'Prueba común',
    'text cleaned';
end $$;
select pg_temp.expect_error($$select save_common_description(null, 'PRUEBA COMUN', array[pg_temp.area('b')])$$,
                            'description_taken');
select pg_temp.expect_error($$select save_common_description(null, '  ', array[pg_temp.area('a')])$$,
                            'description_required');
select pg_temp.expect_error($$select save_common_description(null, 'Prueba otra', array[]::smallint[])$$,
                            'areas_required');
select pg_temp.expect_error($$select save_common_description(null, 'Prueba otra', array[32000]::smallint[])$$,
                            'area_invalid');
select pg_temp.expect_error($$select save_common_description('No existe', 'Prueba otra', array[pg_temp.area('a')])$$,
                            'description_missing');

-- Changing the text and the departments together.
select pg_temp.ok($$select save_common_description('prueba comun', 'Prueba común editada',
                                                   array[pg_temp.area('a'), pg_temp.area('b')])$$);
do $$ begin
  assert (select count(*) from common_descriptions where description = 'Prueba común editada') = 2, 'two departments';
  assert not exists (select from common_descriptions where description = 'Prueba común'), 'old text gone';
end $$;

-- An archived department: kept by a description that had it, refused for others.
select pg_temp.ok($$select save_common_description(null, 'Prueba con C', array[pg_temp.area('c')])$$);
select pg_temp.ok($$select apply_area_archived(pg_temp.area('c'), '2027-03-01', '2027-03-10')$$);
select pg_temp.ok($$select save_common_description('Prueba con C', 'Prueba con C bis', array[pg_temp.area('c')])$$);
select pg_temp.expect_error($$select save_common_description(null, 'Prueba nueva C', array[pg_temp.area('c')])$$,
                            'area_invalid');

select pg_temp.ok($$select delete_common_description('PRUEBA COMÚN EDITADA')$$);
do $$ begin
  assert not exists (select from common_descriptions where description = 'Prueba común editada'), 'deleted';
end $$;
select pg_temp.expect_error($$select delete_common_description('Prueba común editada')$$, 'description_missing');

-- Too-vague descriptions -------------------------------------------------------------------------

select pg_temp.ok($$select save_vague_description(null, ' Prueba  vaga ')$$);
select pg_temp.expect_error($$select save_vague_description(null, 'prueba vaga')$$, 'description_taken');
select pg_temp.expect_error($$select save_vague_description(null, '')$$, 'description_required');
select pg_temp.expect_error($$select save_vague_description('No existe', 'Prueba x')$$, 'description_missing');
select pg_temp.ok($$select save_vague_description('PRUEBA VAGA', 'Prueba vaga dos')$$);
do $$ begin
  assert exists (select from vague_descriptions where description = 'Prueba vaga dos'), 'edited';
  assert not exists (select from vague_descriptions where description = 'Prueba vaga'), 'old text gone';
end $$;
select pg_temp.ok($$select delete_vague_description('prueba vaga dos')$$);
select pg_temp.expect_error($$select delete_vague_description('Prueba vaga dos')$$, 'description_missing');

-- Never in both lists, through the functions or directly in the tables ---------------------------

select pg_temp.expect_error($$select save_vague_description(null, 'prueba con c bis')$$,
                            'description_in_both_lists');
select pg_temp.expect_error($$select save_common_description(null, 'COPIAS', array[pg_temp.area('a')])$$,
                            'description_in_both_lists');
select pg_temp.expect_error($$insert into vague_descriptions values ('Prueba con C bis')$$,
                            'description_in_both_lists');
select pg_temp.expect_error($$insert into common_descriptions values (pg_temp.area('a'), 'cópias')$$,
                            'description_in_both_lists');

-- Deleting a department (0022): only without entries and without accounts -------------------------

select pg_temp.as_stranger();
select pg_temp.expect_error($$select * from list_area_usage()$$, 'not_admin');
select pg_temp.expect_error($$select delete_area(pg_temp.area('c'))$$, 'not_admin');
select pg_temp.as_operator();

-- B: two entries (15/02 and 05/03; the others were moved to Alfa) and three accounts.
do $$ begin
  assert (select entry_count from list_area_usage() where area_id = pg_temp.area('b')) = 2, 'B: 2 entries';
  assert (select account_count from list_area_usage() where area_id = pg_temp.area('b')) = 3, 'B: 3 accounts';
  assert (select entry_count from list_area_usage() where area_id = pg_temp.area('c')) = 0, 'C: no entries';
end $$;

select pg_temp.expect_error($$select delete_area(pg_temp.area('b'))$$, 'area_has_entries');
select pg_temp.expect_error($$select delete_area(32000::smallint)$$, 'area_invalid');

-- D: no entries, but an account has it.
insert into d values ('d', create_area('Prueba Depto D'));
insert into acc values
  ('cuatro', create_account('Prueba Listas Cuatro', '8888', array[pg_temp.area('d')], pg_temp.area('d')));
select pg_temp.expect_error($$select delete_area(pg_temp.area('d'))$$, 'area_has_accounts');

-- C: archived, no entries, no accounts, one usual description of its own ("Prueba con C bis").
-- Another description has C and Alfa: it keeps Alfa.
select pg_temp.ok($$select save_common_description(null, 'Prueba C y Alfa', array[pg_temp.area('a')])$$);
insert into common_descriptions values (pg_temp.area('c'), 'Prueba C y Alfa'); -- C is archived: directly
select pg_temp.ok($$select delete_area(pg_temp.area('c'))$$);
do $$ begin
  assert not exists (select from areas where id = pg_temp.area('c')), 'C deleted';
  assert not exists (select from common_descriptions where description = 'Prueba con C bis'), 'its description gone';
  assert (select array_agg(area_id) from common_descriptions where description = 'Prueba C y Alfa')
         = array[pg_temp.area('a')], 'the shared description keeps Alfa';
end $$;

-- Deleting an anillado size (0023): only without entries -------------------------------------------

select pg_temp.as_stranger();
select pg_temp.expect_error($$select * from list_size_usage()$$, 'not_admin');
select pg_temp.expect_error($$select delete_anillado_size(98::smallint)$$, 'not_admin');
select pg_temp.as_operator();

-- 96 mm, used by one entry; 98 mm (added above) used by none.
select pg_temp.ok($$select apply_new_size(96::smallint, '2027-03-01', 700, '2027-03-10')$$);
select pg_temp.ok(format($$select register_manual_entry(%s, '2027-03-05', %s::smallint, 'Prueba listas 0021', 0,
  '[{"size_mm": 96, "quantity": 2}]')$$, pg_temp.account('uno'), pg_temp.area('a')));
do $$ begin
  assert (select entry_count from list_size_usage() where size_mm = 96) = 1, '96: 1 entry';
  assert (select entry_count from list_size_usage() where size_mm = 98) = 0, '98: no entries';
end $$;

select pg_temp.expect_error($$select delete_anillado_size(96::smallint)$$, 'anillado_size_has_entries');
select pg_temp.expect_error($$select delete_anillado_size(32000::smallint)$$, 'size_invalid');
select pg_temp.ok($$select delete_anillado_size(98::smallint)$$);
do $$ begin
  assert not exists (select from anillado_sizes where size_mm = 98), '98 deleted';
  assert not exists (select from anillado_prices where size_mm = 98), 'its prices too';
  assert exists (select from anillado_sizes where size_mm = 96), '96 kept';
end $$;

-- Reached only if every check above passed (the SQL Editor shows the last result).
select 'All operator list tests passed' as result;

rollback;
