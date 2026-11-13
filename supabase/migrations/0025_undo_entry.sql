-- 0025: staff undo their own entry right after saving it, with their PIN (story #20, task #108).
-- Apply once, in the Supabase SQL Editor, after 0024: first in the test project; in production when
-- the #20 PR is merged (it is safe earlier: it only adds a table and functions, and backup_data keeps
-- its behaviour). Never edit after applying: write 0026_... instead.
-- Tests: supabase/tests/undo_entry.sql (and supabase/tests/backups.sql again, for backup_data).

-- The form (#109) shows "Deshacer" for 10 seconds after saving; the PIN prompt then stays open for at
-- most 1 minute. The database allows 90 seconds after the save (margin for the connection), by its own
-- clock, so the phone's clock does not matter.

-- Wrong PINs, per entry ----------------------------------------------------------------------
-- After 3 wrong PINs the entry can no longer be undone; the account stays open: saving entries and
-- "Mi cuenta" keep accepting PINs (PO, 09/11; decision of 24/10). Kept apart from entries, the
-- business record; removed with the entry.

create table undo_failures (
  entry_id bigint primary key references entries (id) on delete cascade,
  attempts smallint not null check (attempts between 1 and 3)
);

-- No grants: written and read by undo_entry only (see 0010).
alter table undo_failures enable row level security;
revoke all on undo_failures from anon, authenticated;

-- Undo -----------------------------------------------------------------------------------------
-- Deletes the entry (and its anillados) when it was saved with an account less than 90 seconds ago,
-- was not edited by the operator, and the account's PIN is right.
-- Returns {"result": "undone"}, or {"result": "pin_wrong", "attempts_left": n} (0 = locked from now).
-- A wrong PIN is a result, not an error: an error would roll back the whole call, the count included.
-- Errors: entry_not_found (also when already undone: the form retries with it after a dropped
-- connection), undo_too_late, undo_locked, and check_own_pin's account_invalid, pin_reset_pending.
create function undo_entry(p_entry_id bigint, p_pin text) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  entry entries%rowtype;
  failures smallint;
begin
  -- for update: two calls at once for the same entry wait for each other, so neither gets extra tries.
  select * into entry from entries where id = p_entry_id for update;
  if not found or entry.account_id is null then
    raise exception 'entry_not_found';
  end if;
  if entry.modified_at is not null or now() - entry.created_at > interval '90 seconds' then
    raise exception 'undo_too_late';
  end if;
  if (select attempts from undo_failures where entry_id = p_entry_id) >= 3 then
    raise exception 'undo_locked';
  end if;

  begin
    perform check_own_pin(entry.account_id, p_pin);
  exception when raise_exception then
    if sqlerrm <> 'pin_wrong' then
      raise;
    end if;
    -- The handler runs after the block is undone, outside it: this count is kept.
    insert into undo_failures (entry_id, attempts) values (p_entry_id, 1)
    on conflict (entry_id) do update set attempts = undo_failures.attempts + 1
    returning attempts into failures;
    return jsonb_build_object('result', 'pin_wrong', 'attempts_left', 3 - failures);
  end;

  delete from entries where id = p_entry_id;
  return jsonb_build_object('result', 'undone');
end;
$$;

revoke execute on function undo_entry from public;
grant execute on function undo_entry to anon, authenticated;

-- Backups: the migration a file belongs to ---------------------------------------------------
-- backup_data (0024) wrote '0024' as a fixed text. Every migration from now on ends by replacing
-- schema_migration() with its own number, so a backup file says which schema its rows need.

create function schema_migration() returns text
language sql
immutable
as $$ select '0025' $$;

-- Same as in 0024, with the migration from schema_migration().
create or replace function backup_data() returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  t record;
  table_rows jsonb;
  tables jsonb := '{}';
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;

  for t in
    select c.relname,
           (select string_agg(quote_ident(a.attname), ', ' order by a.attnum)
            from pg_attribute a
            where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped and a.attgenerated = ''
           ) as cols,
           (select string_agg(quote_ident(a.attname), ', ' order by array_position(i.indkey::smallint[], a.attnum))
            from pg_index i
            join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any (i.indkey)
            where i.indrelid = c.oid and i.indisprimary
           ) as pk
    from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname <> 'admins'
    order by c.relname
  loop
    execute format('select coalesce(jsonb_agg(to_jsonb(r) order by %s), ''[]'') from (select %s from %I) r',
                   coalesce(t.pk, t.cols), t.cols, t.relname)
      into table_rows;
    tables := tables || jsonb_build_object(t.relname, table_rows);
  end loop;

  -- "migration": the schema the rows belong to; a restore needs a database at the same migration.
  return jsonb_build_object('app', 'fotocopias-upb', 'format', 1, 'migration', schema_migration(),
                            'created_at', now(), 'tables', tables);
end;
$$;
