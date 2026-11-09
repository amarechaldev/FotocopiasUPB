-- 0024: daily backups started by the operator (story #51, decision log 2026-10-26).
-- Apply once, in the Supabase SQL Editor, after 0023: first in the test project; in production when
-- the #51 PR is merged (it is safe earlier: it only adds a table and functions).
-- Never edit after applying: write 0025_... instead. Tests: supabase/tests/backups.sql.

-- The operator's screen downloads backup_data() as a file, then calls record_backup(). Two calls:
-- if the connection drops before the file is saved, no backup is recorded and the reminder stays on.
-- A restore (developer script, #106) rebuilds the tables from the file in an emptied database.

-- One row per backup made; last_backup_at() drives the reminder after 23 hours.
create table backups (
  id bigint generated always as identity primary key,
  taken_at timestamptz not null default now()
);

-- No grants: written by record_backup, read by last_backup_at (see 0010).
alter table backups enable row level security;
revoke all on backups from anon, authenticated;

-- Every table in public, except admins, as {"tables": {"<table>": [<row>, ...]}}, PIN hashes included.
-- - The tables are read from the catalog, so a table added by a later migration is included without
--   changing this function.
-- - admins only holds ids of auth.users, which a backup cannot restore: after a restore, the operator's
--   login is set up again by hand (docs/maintenance.md).
-- - Generated columns (areas.active) are left out: the database computes them again.
-- - Rows are sorted by primary key, so the same data always gives the same file.
-- Errors: not_admin.
create function backup_data() returns jsonb
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
  return jsonb_build_object('app', 'fotocopias-upb', 'format', 1, 'migration', '0024',
                            'created_at', now(), 'tables', tables);
end;
$$;

-- Called after the file download has started. Returns the time recorded. Errors: not_admin.
create function record_backup() returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  new_taken_at timestamptz;
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;

  insert into backups default values returning taken_at into new_taken_at;
  return new_taken_at;
end;
$$;

-- The time of the last backup, or null if there was none. Errors: not_admin.
create function last_backup_at() returns timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;

  return (select max(b.taken_at) from backups b);
end;
$$;

revoke execute on function backup_data, record_backup, last_backup_at from public, anon;
grant execute on function backup_data, record_backup, last_backup_at to authenticated;
