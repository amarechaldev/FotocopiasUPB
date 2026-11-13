-- Tests for staff undoing their own entry (0025). Paste into the SQL Editor of the TEST project only,
-- after 0025. Run supabase/tests/backups.sql again too: 0025 rewrote backup_data.
-- Everything runs in one transaction that is rolled back: the test accounts and entries are not
-- kept. The first failed check stops the script with its message; success = no error at the end.
-- Ages, edits, resets and archiving are set with plain updates (the SQL Editor is the table owner).

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

-- A staff entry of 5 copias and 1 anillado, today, in the account's default department.
create function pg_temp.entry(p_account_id bigint, p_pin text) returns bigint
language sql as $$
  select register_account_entry(p_account_id, p_pin, null,
                                (select default_area_id from list_accounts() where id = p_account_id),
                                'Prueba deshacer 0025', 5,
                                jsonb_build_array(jsonb_build_object(
                                  'size_mm', (select min(size_mm) from anillado_sizes where archived_from is null),
                                  'quantity', 1)))
$$;

-- undo_entry as a statement for expect_error.
create function pg_temp.undo(p_entry_id bigint, p_pin text) returns text
language sql as $$
  select format('select undo_entry(%s, %L)', p_entry_id, p_pin)
$$;

create function pg_temp.entry_exists(p_entry_id bigint) returns boolean
language sql as $$
  select exists (select from entries where id = p_entry_id)
$$;

-- Two test accounts (names unlikely to exist).
create temp table acc as
select create_account('Prueba Deshacer Uno', '1111', array[a.id], a.id) as one,
       create_account('Prueba Deshacer Dos', '2222', array[a.id], a.id) as two
from (select min(id) as id from areas where active) a;

-- Right PIN: the entry, its anillados and its counter are gone --------------------------------

do $$
declare
  e bigint := pg_temp.entry((select one from acc), '1111');
begin
  assert undo_entry(e, '0000') = '{"result": "pin_wrong", "attempts_left": 2}', 'first wrong PIN';
  assert undo_entry(e, '1111') = '{"result": "undone"}', 'right PIN after a wrong one: undone';
  assert not pg_temp.entry_exists(e), 'undone: the entry is still there';
  assert not exists (select from entry_anillados where entry_id = e), 'undone: anillados left behind';
  assert not exists (select from undo_failures where entry_id = e), 'undone: counter left behind';
  -- A retry (e.g. after a dropped connection) says it is gone.
  perform pg_temp.expect_error(pg_temp.undo(e, '1111'), 'entry_not_found');
end $$;

-- Entries that cannot be undone ------------------------------------------------------------

select pg_temp.expect_error(pg_temp.undo(-1, '1111'), 'entry_not_found');

-- An entry without an account (the operator's manual entries, #46).
do $$
declare
  e bigint;
begin
  insert into entries (area_id, name, description, copias)
  values ((select min(id) from areas where active), 'Prueba Sin Cuenta', 'Prueba deshacer 0025', 5)
  returning id into e;
  perform pg_temp.expect_error(pg_temp.undo(e, '1111'), 'entry_not_found');
  assert pg_temp.entry_exists(e), 'entry without account removed';
end $$;

-- 90 seconds after saving: still possible just before, too late just after.
do $$
declare
  e bigint := pg_temp.entry((select one from acc), '1111');
begin
  update entries set created_at = now() - interval '91 seconds' where id = e;
  perform pg_temp.expect_error(pg_temp.undo(e, '1111'), 'undo_too_late');
  assert pg_temp.entry_exists(e), 'too late: entry removed';

  update entries set created_at = now() - interval '89 seconds' where id = e;
  assert undo_entry(e, '1111') ->> 'result' = 'undone', '89 seconds: should be undone';
end $$;

-- Edited by the operator meanwhile: too late, whatever its age.
do $$
declare
  e bigint := pg_temp.entry((select one from acc), '1111');
begin
  update entries set modified_at = now() where id = e;
  perform pg_temp.expect_error(pg_temp.undo(e, '1111'), 'undo_too_late');
  assert pg_temp.entry_exists(e), 'edited: entry removed';
end $$;

-- Wrong PINs ---------------------------------------------------------------------------------

do $$
declare
  e bigint := pg_temp.entry((select one from acc), '1111');
  other bigint := pg_temp.entry((select one from acc), '1111');
begin
  assert undo_entry(e, '0000') = '{"result": "pin_wrong", "attempts_left": 2}', 'wrong PIN 1';
  assert undo_entry(e, null) = '{"result": "pin_wrong", "attempts_left": 1}', 'wrong PIN 2 (none given)';
  -- Another account's PIN is a wrong PIN too.
  assert undo_entry(e, '2222') = '{"result": "pin_wrong", "attempts_left": 0}', 'wrong PIN 3';

  -- Locked: even the right PIN is refused, and the entry stays.
  perform pg_temp.expect_error(pg_temp.undo(e, '1111'), 'undo_locked');
  assert pg_temp.entry_exists(e), 'locked: entry removed';
  assert (select attempts from undo_failures where entry_id = e) = 3, 'locked: 3 attempts recorded';

  -- The count is per entry: the same account's other entry can still be undone.
  assert undo_entry(other, '1111') ->> 'result' = 'undone', 'other entry: should be undone';

  -- The account stays open: it still saves entries with its PIN.
  perform pg_temp.entry((select one from acc), '1111');
end $$;

-- Pending reset and archived accounts: their errors, the entry stays, no attempt counted ------

do $$
declare
  e bigint := pg_temp.entry((select two from acc), '2222');
begin
  update accounts set pin_reset_pending = true where id = (select two from acc);
  perform pg_temp.expect_error(pg_temp.undo(e, '2222'), 'pin_reset_pending');
  update accounts set pin_reset_pending = false, archived = true where id = (select two from acc);
  perform pg_temp.expect_error(pg_temp.undo(e, '2222'), 'account_invalid');
  assert pg_temp.entry_exists(e), 'reset or archived: entry removed';
  assert not exists (select from undo_failures where entry_id = e), 'reset or archived: attempt counted';
end $$;

-- Who can call what --------------------------------------------------------------------------

do $$ begin
  assert has_function_privilege('anon', 'undo_entry(bigint, text)', 'execute'), 'anon cannot call undo_entry';
  assert not has_table_privilege('anon', 'undo_failures', 'select'), 'anon can read undo_failures';
  assert not has_table_privilege('authenticated', 'undo_failures', 'select'),
    'authenticated can read undo_failures';
  assert schema_migration() = '0025', 'schema_migration() should be 0025';
end $$;

-- Reached only if every check above passed (the SQL Editor shows the last result).
select 'All undo tests passed' as result;

rollback;
