-- 0008: the operator edits, deletes and undoes; empty entries are refused.
-- Apply once, in the Supabase SQL Editor, after 0007. Never edit after applying: write 0009_... instead.
-- Safe before the app that uses it: the current app ignores the new list columns.

-- Edited entries -------------------------------------------------------------
-- When the operator last edited the entry; null = never. Shown as "Modificado" in her
-- list only, never in the reports. No history is kept (decision log 2026-10-14).

alter table entries add column modified_at timestamptz;

-- Empty entries --------------------------------------------------------------
-- An entry needs at least 1 copia or 1 anillado (PO, #5), for staff and operator alike.
-- Negative numbers are already refused by the table checks.

create function entry_is_empty(p_copias integer, p_anillados jsonb) returns boolean
language sql
immutable
as $$
  select coalesce(p_copias, 0)
       + coalesce((select sum((a ->> 'quantity')::integer)
                   from jsonb_array_elements(coalesce(p_anillados, '[]')) as a), 0) <= 0
$$;

revoke execute on function entry_is_empty from public, anon, authenticated;

-- Same as in 0003, plus the entry_empty check.
create or replace function register_account_entry(
  p_account_id bigint,
  p_pin text,
  p_entry_date date,
  p_area_id smallint,
  p_description text,
  p_copias integer,
  p_anillados jsonb default '[]'  -- e.g. [{"size_mm": 12, "quantity": 2}]
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  account accounts%rowtype;
  new_id bigint;
begin
  select * into account from accounts where id = p_account_id;
  if not found then
    raise exception 'account_invalid';
  end if;
  -- crypt() re-hashes the PIN with the salt stored in the hash; equal only for the right PIN.
  if account.pin_hash <> extensions.crypt(coalesce(p_pin, ''), account.pin_hash) then
    raise exception 'pin_wrong';
  end if;
  if entry_is_empty(p_copias, p_anillados) then
    raise exception 'entry_empty';
  end if;

  insert into entries (entry_date, area_id, account_id, name, description, copias)
  values (coalesce(p_entry_date, (now() at time zone 'America/La_Paz')::date),
          p_area_id, account.id, account.name, btrim(p_description), coalesce(p_copias, 0))
  returning id into new_id;

  insert into entry_anillados (entry_id, size_mm, quantity)
  select new_id, (a ->> 'size_mm')::smallint, (a ->> 'quantity')::integer
  from jsonb_array_elements(p_anillados) as a;

  return new_id;
end;
$$;

-- The operator's list (replaces 0006: two more columns, so it must be dropped first) -----

drop function list_entries(date, date);

create function list_entries(p_from date, p_to date)
returns table (
  id bigint,
  entry_date date,
  created_at timestamptz,
  modified_at timestamptz,
  area_id smallint,
  area_name text,
  account_id bigint,
  name text,
  description text,
  copias integer,
  anillados jsonb  -- e.g. [{"size_mm": 12, "quantity": 2}], smallest size first
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;

  -- Columns are always qualified (e., ar., a.): the output columns above share their names.
  return query
  select e.id, e.entry_date, e.created_at, e.modified_at, e.area_id, ar.name, e.account_id,
         e.name, e.description, e.copias,
         coalesce(
           (select jsonb_agg(jsonb_build_object('size_mm', a.size_mm, 'quantity', a.quantity)
                             order by a.size_mm)
            from entry_anillados a
            where a.entry_id = e.id),
           '[]'::jsonb)
  from entries e
  join areas ar on ar.id = e.area_id
  where e.entry_date between p_from and p_to
  order by e.created_at desc;
end;
$$;

-- Editing an entry -----------------------------------------------------------
-- Checked like a new entry; the name comes from the account. A department outside the
-- account is only a warning in the app. Errors are short codes; the app turns them into
-- Spanish messages: not_admin, entry_missing, account_invalid, date_required,
-- description_required, area_invalid, entry_empty

create function update_entry(
  p_id bigint,
  p_account_id bigint,
  p_entry_date date,
  p_area_id smallint,
  p_description text,
  p_copias integer,
  p_anillados jsonb default '[]'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  account_name text;
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  select a.name into account_name from accounts a where a.id = p_account_id;
  if not found then
    raise exception 'account_invalid';
  end if;
  if p_entry_date is null then
    raise exception 'date_required';
  end if;
  if btrim(coalesce(p_description, '')) = '' then
    raise exception 'description_required';
  end if;
  if not exists (select from areas where areas.id = p_area_id) then
    raise exception 'area_invalid';
  end if;
  if entry_is_empty(p_copias, p_anillados) then
    raise exception 'entry_empty';
  end if;

  update entries
  set entry_date = p_entry_date,
      area_id = p_area_id,
      account_id = p_account_id,
      name = account_name,
      description = btrim(p_description),
      copias = coalesce(p_copias, 0),
      modified_at = now()
  where id = p_id;
  if not found then
    raise exception 'entry_missing';
  end if;

  delete from entry_anillados where entry_id = p_id;
  insert into entry_anillados (entry_id, size_mm, quantity)
  select p_id, (a ->> 'size_mm')::smallint, (a ->> 'quantity')::integer
  from jsonb_array_elements(coalesce(p_anillados, '[]')) as a;
end;
$$;

-- Deleting an entry (its anillados go with it: on delete cascade) -------------

create function delete_entry(p_id bigint) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;
  delete from entries where id = p_id;
  if not found then
    raise exception 'entry_missing';
  end if;
end;
$$;

-- Undo -------------------------------------------------------------------------
-- Puts an entry back exactly as the app last saw it, before an edit or a delete: same
-- number, saved time, name and "Modificado" state. The earlier version is kept only in
-- the operator's browser until her next action; the database keeps no history.

create function restore_entry(
  p_id bigint,
  p_entry_date date,
  p_created_at timestamptz,
  p_modified_at timestamptz,
  p_area_id smallint,
  p_account_id bigint,
  p_name text,
  p_description text,
  p_copias integer,
  p_anillados jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'not_admin';
  end if;

  delete from entries where id = p_id;  -- the edited version, if any
  -- overriding system value: reuse the old number instead of taking a new one.
  insert into entries (id, entry_date, created_at, modified_at, area_id, account_id, name,
                       description, copias)
  overriding system value
  values (p_id, p_entry_date, p_created_at, p_modified_at, p_area_id, p_account_id, p_name,
          p_description, p_copias);

  insert into entry_anillados (entry_id, size_mm, quantity)
  select p_id, (a ->> 'size_mm')::smallint, (a ->> 'quantity')::integer
  from jsonb_array_elements(coalesce(p_anillados, '[]')) as a;
end;
$$;

revoke execute on function list_entries, update_entry, delete_entry, restore_entry
  from public, anon;
grant execute on function list_entries, update_entry, delete_entry, restore_entry
  to authenticated;
