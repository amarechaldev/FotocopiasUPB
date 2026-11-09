-- Tests for the backups (0024). Paste into the SQL Editor of the TEST project only, after 0024,
-- and again after 0025 (it rewrote backup_data).
-- Everything runs in one transaction that is rolled back: no data is left behind. The first failed
-- check stops the script with its message; success = no error at the end.
-- The project needs a row in admins and at least one staff account.

begin;

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

do $$ begin
  assert exists (select from admins), 'no admin in this project: log in once as the operator';
  assert exists (select from accounts), 'no staff account in this project: create one first';
end $$;

-- Not the operator: every backup function refuses -----------------------------------------

select pg_temp.as_stranger();
select pg_temp.expect_error($$select backup_data()$$, 'not_admin');
select pg_temp.expect_error($$select record_backup()$$, 'not_admin');
select pg_temp.expect_error($$select last_backup_at()$$, 'not_admin');

select pg_temp.as_operator();

-- The file: every table but admins, every row as stored ------------------------------------

do $$
declare
  b jsonb := backup_data();
  t text;
  cols text;
  diff integer;
begin
  assert b ->> 'app' = 'fotocopias-upb' and b ->> 'format' = '1' and b ->> 'migration' = schema_migration(),
         'header: ' || (b - 'tables')::text;

  assert (select array_agg(k order by k) from jsonb_object_keys(b -> 'tables') k)
       = (select array_agg(tablename::text order by tablename)
          from pg_tables where schemaname = 'public' and tablename <> 'admins'),
         'tables in the file: ' || (select string_agg(k, ', ') from jsonb_object_keys(b -> 'tables') k);

  -- Each table's rows, turned back into rows (as a restore would), must equal the table exactly:
  -- nothing missing, nothing extra, every value the same.
  for t in select tablename from pg_tables where schemaname = 'public' and tablename <> 'admins' loop
    select string_agg(quote_ident(attname), ', ') into cols
    from pg_attribute
    where attrelid = format('public.%I', t)::regclass and attnum > 0 and not attisdropped and attgenerated = '';

    execute format(
      'select (select count(*) from (select %1$s from %2$I except all
                                     select %1$s from jsonb_populate_recordset(null::%2$I, $1)) x)
            + (select count(*) from (select %1$s from jsonb_populate_recordset(null::%2$I, $1) except all
                                     select %1$s from %2$I) y)', cols, t)
      using b -> 'tables' -> t
      into diff;
    assert diff = 0, format('%s: %s rows differ between the table and the file', t, diff);
  end loop;

  -- PIN hashes are in the file; generated columns are not; rows come by primary key.
  assert b -> 'tables' -> 'accounts' -> 0 ->> 'pin_hash' = (select pin_hash from accounts order by id limit 1),
         'first account: PIN hash missing, or not sorted by id';
  assert not (b -> 'tables' -> 'areas' -> 0 ? 'active'), 'areas.active (generated) should not be in the file';
end $$;

-- Recording a backup ----------------------------------------------------------------------

delete from backups; -- as if none was ever made (undone by the rollback)

do $$
declare
  taken timestamptz;
begin
  assert last_backup_at() is null, 'no backup yet: last_backup_at() should be null';

  perform backup_data();
  assert not exists (select from backups), 'backup_data() must not record a backup';

  taken := record_backup();
  assert taken is not null, 'record_backup() returns the time';
  assert last_backup_at() = taken, 'last_backup_at() should be the one just recorded';
  assert (select count(*) from backups) = 1, 'one row per backup';
end $$;

-- Reached only if every check above passed (the SQL Editor shows the last result).
select 'All backup tests passed' as result;

rollback;
