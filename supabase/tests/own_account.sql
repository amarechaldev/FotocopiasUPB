-- Tests for staff editing their own profile (0019). Paste into the SQL Editor of the TEST project
-- only, after 0019. Run supabase/tests/account_management.sql again too: 0019 rewrote update_account.
-- Everything runs in one transaction that is rolled back: the test accounts and entries are not
-- kept. The first failed check stops the script with its message; success = no error at the end.
-- Archiving and PIN resets are set with plain updates (the SQL Editor is the table owner), so no
-- operator login is needed.

begin;

-- Helpers (pg_temp: they disappear with the session) --------------------------------------

-- The statement must fail with this exact error code.
create function pg_temp.expect_error(p_sql text, p_code text) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    assert sqlerrm = p_code, format('%s: expected %s, got %s', p_sql, p_code, sqlerrm);
    return;
  end;
  raise exception '%: expected %, but it worked', p_sql, p_code;
end;
$$;

-- A staff entry of 5 copias, today, in the account's default department, with this PIN.
create function pg_temp.entry(p_account_id bigint, p_pin text) returns bigint
language sql as $$
  select register_account_entry(p_account_id, p_pin, null,
                                (select default_area_id from list_accounts() where id = p_account_id),
                                'Prueba cuenta propia 0019', 5, '[]')
$$;

-- update_own_account as a statement for expect_error.
create function pg_temp.own_edit(p_account_id bigint, p_pin text, p_name text, p_area_ids smallint[],
                                 p_default smallint, p_new_pin text default null) returns text
language sql as $$
  select format('select update_own_account(%s, %L, %L, %L::smallint[], %s::smallint, %L)',
                p_account_id, p_pin, p_name, p_area_ids, coalesce(p_default::text, 'null'), p_new_pin)
$$;

-- Two departments and three test accounts (names unlikely to exist).
create temp table t as
select (select min(id) from areas where active) as area_a,
       (select max(id) from areas where active) as area_b;

create temp table acc as
select create_account('Prueba Propia Uno', '1111', array[t.area_a], t.area_a) as one,
       create_account('Prueba Propia Dos', '2222', array[t.area_a], t.area_a) as two,
       create_account('Prueba Propia Tres', '3333', array[t.area_b], t.area_b) as three
from t;

-- Logging in: check_own_pin ---------------------------------------------------------------

select check_own_pin(acc.one, '1111') from acc;
select pg_temp.expect_error(format('select check_own_pin(%s, %L)', acc.one, '0000'), 'pin_wrong') from acc;
select pg_temp.expect_error(format('select check_own_pin(%s, null)', acc.one), 'pin_wrong') from acc;
select pg_temp.expect_error(format('select check_own_pin(%s, %L)', -1, '1111'), 'account_invalid');

-- Editing name and departments ------------------------------------------------------------

select pg_temp.entry(acc.one, '1111') from acc;
select pg_temp.entry(acc.one, '1111') from acc;

-- Wrong PIN: refused, nothing changes.
select pg_temp.expect_error(pg_temp.own_edit(acc.one, '0000', 'Otro Nombre', array[t.area_b], t.area_b),
                            'pin_wrong') from acc, t;
do $$ begin
  assert (select name = 'Prueba Propia Uno' and area_ids = array[t.area_a]
          from list_accounts(), acc, t where id = acc.one),
    'wrong PIN: the account changed';
end $$;

-- Rename, add a department, change the default: all the account's entries get the new name.
select update_own_account(acc.one, '1111', '  Prueba   Propia Uno Bis ', array[t.area_a, t.area_b],
                          t.area_b)
from acc, t;
do $$ begin
  assert (select name from list_accounts(), acc where id = acc.one) = 'Prueba Propia Uno Bis',
    'rename: spaces cleaned';
  assert (select count(*) from entries, acc where account_id = acc.one and name = 'Prueba Propia Uno Bis') = 2,
    'rename: both entries renamed';
  assert (select area_ids = array[t.area_a, t.area_b] and default_area_id = t.area_b
          from list_accounts(), acc, t where id = acc.one),
    'departments and default changed';
end $$;
-- No new PIN given: the PIN is kept.
select pg_temp.entry(acc.one, '1111') from acc;

-- The checks, with the same codes as account creation and the operator's edit.
select pg_temp.expect_error(pg_temp.own_edit(acc.two, '2222', '  ', array[t.area_a], t.area_a),
                            'name_required') from acc, t;
select pg_temp.expect_error(pg_temp.own_edit(acc.two, '2222', 'Prueba Propia Dos', array[]::smallint[], t.area_a),
                            'areas_required') from acc, t;
select pg_temp.expect_error(pg_temp.own_edit(acc.two, '2222', 'Prueba Propia Dos', array[t.area_a], t.area_b),
                            'default_invalid') from acc, t;
select pg_temp.expect_error(pg_temp.own_edit(acc.two, '2222', 'Prueba Propia Dos', array[-1]::smallint[], -1::smallint),
                            'area_invalid') from acc;
-- Another account's name, differing only in case and accents.
select pg_temp.expect_error(pg_temp.own_edit(acc.two, '2222', 'PRUEBA PROPIA TRÉS', array[t.area_a], t.area_a),
                            'name_taken') from acc, t;
-- Its own name, unchanged: allowed.
select update_own_account(acc.two, '2222', 'Prueba Propia Dos', array[t.area_a], t.area_a) from acc, t;

-- A department archived later (#33) stays valid for an account that already has it, not for others.
update areas set archived_from = date_trunc('month', current_date)::date from t where id = t.area_b;
select update_own_account(acc.three, '3333', 'Prueba Propia Tres', array[t.area_b], t.area_b) from acc, t;
select pg_temp.expect_error(pg_temp.own_edit(acc.two, '2222', 'Prueba Propia Dos', array[t.area_b], t.area_b),
                            'area_invalid') from acc, t;
update areas set archived_from = null from t where id = t.area_b;

-- Changing the PIN --------------------------------------------------------------------------

select pg_temp.expect_error(pg_temp.own_edit(acc.two, '2222', 'Prueba Propia Dos', array[t.area_a], t.area_a, '12a4'),
                            'pin_invalid') from acc, t;
select pg_temp.expect_error(pg_temp.own_edit(acc.two, '2222', 'Prueba Propia Dos', array[t.area_a], t.area_a, '123'),
                            'pin_invalid') from acc, t;

-- A refused edit changes nothing, not even the PIN given with it.
select pg_temp.expect_error(pg_temp.own_edit(acc.two, '2222', 'Prueba Propia Tres', array[t.area_a], t.area_a, '9999'),
                            'name_taken') from acc, t;
select pg_temp.entry(acc.two, '2222') from acc;

-- New PIN: the old one stops working, the new one works.
select update_own_account(acc.two, '2222', 'Prueba Propia Dos', array[t.area_a], t.area_a, '9999') from acc, t;
select pg_temp.expect_error(format('select pg_temp.entry(%s, %L)', acc.two, '2222'), 'pin_wrong') from acc;
select pg_temp.entry(acc.two, '9999') from acc;
select check_own_pin(acc.two, '9999') from acc;
-- The same PIN again: allowed.
select update_own_account(acc.two, '9999', 'Prueba Propia Dos', array[t.area_a], t.area_a, '9999') from acc, t;
select check_own_pin(acc.two, '9999') from acc;

-- Pending reset and archived accounts --------------------------------------------------------

-- During a PIN reset, the old PIN no longer works here either (even the right one).
update accounts set pin_reset_pending = true from acc where id = acc.two;
select pg_temp.expect_error(format('select check_own_pin(%s, %L)', acc.two, '9999'), 'pin_reset_pending') from acc;
select pg_temp.expect_error(pg_temp.own_edit(acc.two, '9999', 'Prueba Propia Dos', array[t.area_a], t.area_a),
                            'pin_reset_pending') from acc, t;
update accounts set pin_reset_pending = false from acc where id = acc.two;

-- Archived: refused, with the right PIN too. Its name stays taken.
update accounts set archived = true from acc where id = acc.three;
select pg_temp.expect_error(format('select check_own_pin(%s, %L)', acc.three, '3333'), 'account_invalid') from acc;
select pg_temp.expect_error(pg_temp.own_edit(acc.three, '3333', 'Prueba Propia Tres', array[t.area_b], t.area_b),
                            'account_invalid') from acc, t;
select pg_temp.expect_error(pg_temp.own_edit(acc.two, '9999', 'prueba propia tres', array[t.area_a], t.area_a),
                            'name_taken') from acc, t;

-- The browser can reach the two staff functions, never the internal one.
do $$ begin
  assert has_function_privilege('anon', 'check_own_pin(bigint, text)', 'execute'),
    'anon cannot call check_own_pin';
  assert has_function_privilege('anon', 'update_own_account(bigint, text, text, smallint[], smallint, text)', 'execute'),
    'anon cannot call update_own_account';
  assert not has_function_privilege('anon', 'save_account_fields(bigint, text, smallint[], smallint)', 'execute'),
    'anon can call save_account_fields';
  assert not has_function_privilege('authenticated', 'save_account_fields(bigint, text, smallint[], smallint)', 'execute'),
    'authenticated can call save_account_fields';
end $$;

-- Reached only if every check above passed (the SQL Editor shows the last result).
select 'All own account tests passed' as result;

rollback;
