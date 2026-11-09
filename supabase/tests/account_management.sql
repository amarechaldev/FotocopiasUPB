-- Tests for account management (0018). Paste into the SQL Editor of the TEST project only, after 0018.
-- Everything runs in one transaction that is rolled back: the test accounts and entries are not
-- kept. The first failed check stops the script with its message; success = no error at the end.
-- The operator is pretended by setting the logged-in user that auth.uid() reads; the test project
-- needs at least one row in admins (the operator's login).

begin;

-- Helpers (pg_temp: they disappear with the session) --------------------------------------

-- Act as the operator, or as a logged-in user who is not an admin.
create function pg_temp.as_operator() returns void
language sql as $$
  select set_config('request.jwt.claims',
                    json_build_object('sub', (select user_id from admins limit 1))::text, true)
$$;

create function pg_temp.as_stranger() returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid())::text, true)
$$;

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

-- A staff entry of 5 copias, today, with this PIN; returns its id.
create function pg_temp.entry(p_account_id bigint, p_pin text) returns bigint
language sql as $$
  select register_account_entry(p_account_id, p_pin, null,
                                (select default_area_id from list_accounts_admin()
                                 where id = p_account_id), 'Prueba cuentas 0018', 5, '[]')
$$;

do $$ begin
  assert exists (select from admins), 'no admin in this project: log in once as the operator';
end $$;

-- Two departments and three test accounts (names unlikely to exist).
create temp table t as
select (select min(id) from areas where active) as area_a,
       (select max(id) from areas where active) as area_b;

create temp table acc as
select create_account('Prueba Cuenta Uno', '1111', array[t.area_a], t.area_a) as one,
       create_account('Prueba Cuenta Dos', '2222', array[t.area_a], t.area_a) as two,
       create_account('Prueba Cuenta Tres', '3333', array[t.area_b], t.area_b) as three
from t;

-- Not the operator: every operator function refuses ------------------------------------------

select pg_temp.as_stranger();
select pg_temp.expect_error('select * from list_accounts_admin()', 'not_admin');
select pg_temp.expect_error(format('select update_account(%s, %L, array[%s]::smallint[], %s::smallint)',
  acc.one, 'X', t.area_a, t.area_a), 'not_admin') from acc, t;
select pg_temp.expect_error(format('select set_pin_reset(%s, true)', acc.one), 'not_admin') from acc;
select pg_temp.expect_error(format('select set_account_archived(%s, true)', acc.one), 'not_admin') from acc;
select pg_temp.expect_error(format('select delete_account(%s)', acc.three), 'not_admin') from acc;

select pg_temp.as_operator();

-- The operator's list: every account, never a PIN hash ----------------------------------------

do $$ begin
  assert (select count(*) from list_accounts_admin() l, acc where l.id in (acc.one, acc.two, acc.three)) = 3,
    'list_accounts_admin: the three test accounts';
  assert not exists (
    select from pg_proc p
    where p.proname in ('list_accounts_admin', 'list_accounts')
      and pg_get_function_result(p.oid) ilike '%hash%'),
    'a list returns the PIN hash';
end $$;

-- Editing -----------------------------------------------------------------------------------

select pg_temp.entry(acc.one, '1111') from acc;
select pg_temp.entry(acc.one, '1111') from acc;

-- Rename, add a department, change the default: all the account's entries get the new name.
select update_account(acc.one, '  Prueba   Cuenta Uno Bis ', array[t.area_a, t.area_b], t.area_b)
from acc, t;
do $$ begin
  assert (select name from list_accounts_admin(), acc where id = acc.one) = 'Prueba Cuenta Uno Bis',
    'rename: spaces cleaned';
  assert (select count(*) from entries, acc where account_id = acc.one and name = 'Prueba Cuenta Uno Bis') = 2,
    'rename: both entries renamed';
  assert (select area_ids = array[t.area_a, t.area_b] and default_area_id = t.area_b
          from list_accounts_admin(), acc, t where id = acc.one),
    'departments and default changed';
end $$;

-- The checks, with the same codes as account creation.
select pg_temp.expect_error(format('select update_account(%s, %L, array[%s]::smallint[], %s::smallint)',
  acc.two, '  ', t.area_a, t.area_a), 'name_required') from acc, t;
select pg_temp.expect_error(format('select update_account(%s, %L, array[]::smallint[], %s::smallint)',
  acc.two, 'Prueba Cuenta Dos', t.area_a), 'areas_required') from acc, t;
select pg_temp.expect_error(format('select update_account(%s, %L, array[%s]::smallint[], %s::smallint)',
  acc.two, 'Prueba Cuenta Dos', t.area_a, t.area_b), 'default_invalid') from acc, t;
select pg_temp.expect_error(format('select update_account(%s, %L, array[%s]::smallint[], %s::smallint)',
  acc.two, 'Prueba Cuenta Dos', -1, -1), 'area_invalid') from acc;
select pg_temp.expect_error(format('select update_account(%s, %L, array[%s]::smallint[], %s::smallint)',
  -1, 'Nadie', t.area_a, t.area_a), 'account_invalid') from t;
-- Another account's name, differing only in case and accents.
select pg_temp.expect_error(format('select update_account(%s, %L, array[%s]::smallint[], %s::smallint)',
  acc.two, 'PRUEBA CUENTA TRÉS', t.area_a, t.area_a), 'name_taken') from acc, t;
-- Its own name, unchanged: allowed.
select update_account(acc.two, 'Prueba Cuenta Dos', array[t.area_a], t.area_a) from acc, t;

-- A department archived later (#33) stays valid for an account that already has it.
update areas set archived_from = date_trunc('month', current_date)::date from t where id = t.area_b;
select update_account(acc.three, 'Prueba Cuenta Tres', array[t.area_b], t.area_b) from acc, t;
select pg_temp.expect_error(format('select update_account(%s, %L, array[%s]::smallint[], %s::smallint)',
  acc.two, 'Prueba Cuenta Dos', t.area_b, t.area_b), 'area_invalid') from acc, t;
update areas set archived_from = null from t where id = t.area_b;

-- Archiving --------------------------------------------------------------------------------

select set_account_archived(acc.two, true) from acc;
do $$ begin
  assert not exists (select from list_accounts(), acc where id = acc.two), 'archived: still in the staff list';
  assert (select archived from list_accounts_admin(), acc where id = acc.two), 'archived: not marked';
end $$;
select pg_temp.expect_error(format('select pg_temp.entry(%s, %L)', acc.two, '2222'), 'account_invalid') from acc;
-- Its name stays taken.
select pg_temp.expect_error(format('select update_account(%s, %L, array[%s]::smallint[], %s::smallint)',
  acc.three, 'Prueba Cuenta Dos', t.area_b, t.area_b), 'name_taken') from acc, t;
select pg_temp.expect_error('select create_account(''prueba cuenta dos'', ''1234'', array[' || t.area_a
  || ']::smallint[], ' || t.area_a || '::smallint)', 'name_taken') from t;
-- Reactivated: back in the list, entries work again.
select set_account_archived(acc.two, false) from acc;
do $$ begin
  assert exists (select from list_accounts(), acc where id = acc.two), 'reactivated: not in the staff list';
end $$;
select pg_temp.entry(acc.two, '2222') from acc;

-- Deleting ---------------------------------------------------------------------------------

select pg_temp.expect_error(format('select delete_account(%s)', acc.one), 'account_has_entries') from acc;
select delete_account(acc.three) from acc;
do $$ begin
  assert not exists (select from list_accounts_admin(), acc where id = acc.three), 'deleted: still listed';
end $$;
select pg_temp.expect_error(format('select delete_account(%s)', acc.three), 'account_invalid') from acc;

-- PIN reset --------------------------------------------------------------------------------

-- No reset pending: a new PIN cannot be set.
select pg_temp.expect_error(format('select set_new_pin(%s, %L)', acc.two, '9999'), 'pin_reset_not_pending') from acc;

select set_pin_reset(acc.two, true) from acc;
do $$ begin
  assert (select pin_reset_pending from list_accounts(), acc where id = acc.two), 'reset: not in the staff list';
  assert (select pin_reset_pending from list_accounts_admin(), acc where id = acc.two), 'reset: not marked';
end $$;
-- The old PIN no longer works; a wrong PIN gets the same answer, so nothing is learnt from it.
select pg_temp.expect_error(format('select pg_temp.entry(%s, %L)', acc.two, '2222'), 'pin_reset_pending') from acc;
select pg_temp.expect_error(format('select pg_temp.entry(%s, %L)', acc.two, '0000'), 'pin_reset_pending') from acc;

-- Cancelled: the old PIN works again.
select set_pin_reset(acc.two, false) from acc;
select pg_temp.entry(acc.two, '2222') from acc;

-- Launched again, then the person chooses a new PIN.
select set_pin_reset(acc.two, true) from acc;
select pg_temp.expect_error(format('select set_new_pin(%s, %L)', acc.two, '12a4'), 'pin_invalid') from acc;
select set_new_pin(acc.two, '9999') from acc;
select pg_temp.entry(acc.two, '9999') from acc;
select pg_temp.expect_error(format('select pg_temp.entry(%s, %L)', acc.two, '2222'), 'pin_wrong') from acc;
-- Only once: the reset is over.
select pg_temp.expect_error(format('select set_new_pin(%s, %L)', acc.two, '5555'), 'pin_reset_not_pending') from acc;

-- An archived account cannot set a new PIN, even with a reset pending.
select set_pin_reset(acc.two, true), set_account_archived(acc.two, true) from acc;
select pg_temp.expect_error(format('select set_new_pin(%s, %L)', acc.two, '5555'), 'account_invalid') from acc;

-- Reached only if every check above passed (the SQL Editor shows the last result).
select 'All account management tests passed' as result;

rollback;
